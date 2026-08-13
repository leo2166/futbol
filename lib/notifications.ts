"use client"

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

export function sendMatchReminder(
  matchTitle: string,
  kickoffDate: string,
  teamName: string,
) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    alert(`¡Recordatorio guardado para ${matchTitle}!`)
    return
  }

  if (Notification.permission === "granted") {
    new Notification(`⚽ Próximo partido de ${teamName}`, {
      body: `${matchTitle}\nFecha: ${new Date(kickoffDate).toLocaleString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      icon: "/icon.svg",
    })
  } else {
    requestNotificationPermission().then((granted) => {
      if (granted) {
        new Notification(`⚽ Recordatorio Activado`, {
          body: `Te avisaremos para el partido: ${matchTitle}`,
          icon: "/icon.svg",
        })
      } else {
        alert(`Recordatorio guardado para: ${matchTitle}`)
      }
    })
  }
}
