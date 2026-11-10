import { ref } from 'vue'
const changed = ref(0)
function key(user: number) {
  return `zalbook.bookings.${user}`
}
export function useJournal(user: () => number | undefined) {
  function ids() {
    void changed.value
    const id = user()
    if (!id) return []
    try {
      const values: unknown = JSON.parse(localStorage.getItem(key(id)) || '[]')
      return Array.isArray(values)
        ? values
            .filter((v): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0)
            .slice(0, 100)
        : []
    } catch {
      return []
    }
  }
  function remember(id: number) {
    const owner = user()
    if (!owner) return
    try {
      localStorage.setItem(
        key(owner),
        JSON.stringify([id, ...ids().filter((value) => value !== id)].slice(0, 100)),
      )
    } catch {
      /* Заявка уже сохранена на сервере. */
    }
    changed.value++
  }
  return { ids, remember }
}
