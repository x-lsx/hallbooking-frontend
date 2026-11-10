"""Изолированный сервер UI-проверок. Все записи только в памяти."""
import json
from datetime import datetime, timedelta, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs

DIST = Path(__file__).resolve().parents[2] / "dist"
profile = dict(id=1, email="demo@example.test", first_name="Алексей", last_name="Тестовый", middle_name=None, phone_number="+79990000000", department=dict(id=1,name="Студенческие объединения"), is_active=True, is_superuser=False, is_verified=True,created_at="2030-01-01T00:00:00Z",updated_at="2030-01-01T00:00:00Z")
formats = [dict(id=i+1,name=name,description=None) for i,name in enumerate(["Лекция","Встреча","Видеоконференция"])]
buildings=[dict(id=1,number="1",name="Главный корпус",address="Университетская, 1"),dict(id=2,number="2",name="Второй корпус",address="Университетская, 2")]
rooms=[dict(id=i+1,building=buildings[i%2],organization=["Лаборатория идей","Центр технологий","Пространство общения"][i%3],number=str(145+i),name=["Аудитория 145","Переговорная «Диалог»","Лекторий «Горизонт»","Мастерская проектов","Зал командной работы","Медиацентр","Клубное пространство","Конференц-зал"][i],capacity=[100,24,60,35,18,50,40,120][i],type="Переговорная" if i%2 else "Лекторий",open_from="08:00:00",open_until="20:00:00",is_active=True,event_formats=formats[:2 if i%2 else 3]) for i in range(8)]
now=datetime.now(timezone.utc)
week=(now-timedelta(days=now.weekday())).replace(hour=0,minute=0,second=0,microsecond=0)
def instant(day,hour):return (week+timedelta(days=day,hours=hour-5)).isoformat()
bookings=[dict(id=i+1,title=title,start_at=instant(i+1,hour),end_at=instant(i+1,hour+2),status="pending" if i==1 else "approved",room_id=1,event_id=1,department_id=1,created_by_id=1,decided_by_id=None,source="online",attendees_count=20,is_public=True,reject_reason=None,requester_first_name="Алексей",requester_last_name="Тестовый",requester_middle_name=None,requester_phone="+79990000000",created_at=now.isoformat()) for i,(title,hour) in enumerate([("Встреча студенческого совета",10),("Лекция: дизайн будущего",13),("Занято",10)])]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(DIST),**kwargs)
    def reply(self,data,status=200):
        self.send_response(status);self.send_header("Content-Type","application/json; charset=utf-8");self.end_headers();self.wfile.write(json.dumps(data,ensure_ascii=False).encode())
    def do_POST(self):self.api()
    def do_GET(self):
        if self.path.startswith("/api/"):return self.api()
        path=DIST/urlparse(self.path).path.lstrip("/")
        if not path.is_file() or path.name=="index.html":
            data=(DIST/"index.html").read_text(encoding="utf-8").replace("<body>",'<body><div style="position:fixed;bottom:8px;left:8px;z-index:99999;background:#fff2cc;color:#725722;font:10px sans-serif;padding:6px 9px;border-radius:5px">UI-ПРОВЕРКА · ТЕСТОВЫЕ ДАННЫЕ</div>').encode()
            self.send_response(200);self.send_header("Content-Type","text/html; charset=utf-8");self.end_headers();self.wfile.write(data);return
        super().do_GET()
    def api(self):
        url=urlparse(self.path);parts=url.path.removeprefix("/api/").split("/");query=parse_qs(url.query)
        def param(name,default=""):return query.get(name,[default])[0]
        data=json.loads(self.rfile.read(int(self.headers.get("Content-Length",0))) or b"{}")
        if parts[0]=="auth":return self.reply(dict(access_token="ui-fixture",refresh_token="ui-fixture",token_type="bearer",expires_in=900,refresh_expires_in=6000))
        if parts==["user","profile"]:return self.reply(profile)
        if parts==["buildings"]:return self.reply(buildings)
        if parts==["event-formats"]:return self.reply(formats)
        if parts==["departments"]:return self.reply([profile["department"]])
        if parts==["rooms"]:
            items=[r for r in rooms if (not param("building_id") or r["building"]["id"]==int(param("building_id"))) and (not param("capacity_min") or r["capacity"]>=int(param("capacity_min"))) and (not param("type") or r["type"]==param("type")) and all(int(v) in [f["id"] for f in r["event_formats"]] for v in query.get("formats_ids",[]))]
            page,size=int(param("page","1")),int(param("size","6"));return self.reply(dict(items=items[(page-1)*size:page*size],total=len(items),page=page,size=size,pages=(len(items)+size-1)//size))
        if len(parts)>=2 and parts[0]=="rooms":
            room_id=int(parts[1])
            if len(parts)==2:return self.reply(rooms[room_id-1])
            if parts[2]=="moderators":return self.reply([]) if room_id==1 else self.reply(dict(detail="Нет прав"),403)
            if parts[2]=="bookings":return self.reply([b for b in bookings if b["room_id"]==room_id and b["status"] in ["approved","pending"] and b["start_at"]<param("end_at") and b["end_at"]>param("start_at")])
        if parts==["bookings"] and self.command=="POST":
            item={**bookings[0],**data,"id":len(bookings)+1,"status":"pending","event_id":data["event_format_id"]};bookings.append(item);return self.reply(item)
        if len(parts)>=2 and parts[0]=="bookings":
            item=next((b for b in bookings if b["id"]==int(parts[1])),None)
            if not item:return self.reply(dict(detail="Нет заявки"),404)
            if len(parts)==3:item["status"]={"approve":"approved","reject":"rejected","cancel":"canselled"}[parts[2]];item["reject_reason"]=data.get("reject_reason")
            return self.reply(item)
        self.reply(dict(detail="Метод не найден"),404)
if __name__=="__main__":
    print("UI fixtures only: http://127.0.0.1:5174",flush=True)
    ThreadingHTTPServer(("127.0.0.1",5174),Handler).serve_forever()
