import { useEffect } from "react";

// Hook personalizado para manejar todos los eventos DOM del dashboard
export const useDashboardEvents = (showNotification?: (type: 'success' | 'error' | 'info', title: string, message: string, rewards?: { candies?: number; xp?: number }) => void) => {
  useEffect(() => {
    // Progress bar inicial
    setTimeout(() => {
      const progressFill = document.querySelector<HTMLElement>(".progress-fill");
      if (progressFill) progressFill.style.width = "35%";

      const challengeFill = document.querySelector<HTMLElement>(
        ".challenge-progress-fill"
      );
      if (challengeFill) challengeFill.style.width = "43%";
    }, 500);

    // Avatar color picker
    document.querySelectorAll<HTMLElement>(".color-option").forEach((option) => {
      option.addEventListener("click", function () {
        document
          .querySelectorAll<HTMLElement>(".color-option")
          .forEach((opt) => opt.classList.remove("active"));
        this.classList.add("active");

        const avatar = document.querySelector<HTMLElement>(".avatar-preview");
        const colorClass = this.className.split(" ")[1];
        if (!avatar) return;

        switch (colorClass) {
          case "color-red":
            avatar.style.background = "#fecaca";
            avatar.style.color = "#dc2626";
            break;
          case "color-green":
            avatar.style.background = "#bbf7d0";
            avatar.style.color = "#059669";
            break;
          case "color-purple":
            avatar.style.background = "#ddd6fe";
            avatar.style.color = "#7c3aed";
            break;
          case "color-yellow":
            avatar.style.background = "#fef3c7";
            avatar.style.color = "#d97706";
            break;
        }
      });
    });

    // Hover en botones
    document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      button.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-1px)";
      });
      button.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0)";
      });
    });

    // Misiones: click en botón - usando setTimeout para asegurar que el DOM esté listo
    setTimeout(() => {
      const missionButtons = document.querySelectorAll<HTMLButtonElement>(".mission-button");
      
      missionButtons.forEach((btn) => {
        btn.addEventListener("click", function () {
          const missionCard = this.closest(".mission-card");
          const missionTitle = missionCard?.querySelector("h3")?.textContent;
          
          if (this.textContent?.includes("Jugar Ahora")) {
            // Obtener el usuario actual del localStorage
            const currentUser = localStorage.getItem('currentUser') || 'estudiante';
            
            // Redirigir a Gimkit con el enlace específico
            const gimkitUrl = `https://www.gimkit.com/join/68b07e476aae0913860a0ca3?username=${encodeURIComponent(currentUser)}`;
            
            // Abrir en nueva ventana para poder detectar cuando regrese
            const gimkitWindow = window.open(gimkitUrl, '_blank', 'width=1200,height=800');
            
            // Detectar cuando la ventana se cierre para dar recompensas
            const checkClosed = setInterval(() => {
              if (gimkitWindow?.closed) {
                clearInterval(checkClosed);
                
                // Simular recompensas por haber jugado
                const candyCounter = document.querySelector('.candy-counter');
                const xpCounter = document.querySelector('.xp-counter');
                if (candyCounter && xpCounter) {
                  const currentCandies = parseInt(candyCounter.textContent?.replace(/[^\d]/g, '') || '0');
                  const currentXP = parseInt(xpCounter.textContent?.replace(/[^\d]/g, '') || '0');
                  candyCounter.textContent = `🍬 ${currentCandies + 10}`;
                  xpCounter.textContent = `⭐ ${currentXP + 25} XP`;
                }
                
                if (showNotification) {
                  showNotification('success', '🎉 ¡Buen trabajo!', `¡Has completado la misión: ${missionTitle}!`, { candies: 10, xp: 25 });
                }
              }
            }, 1000);
          } else if (this.textContent?.includes("Desbloquear")) {
            if (showNotification) {
              showNotification('success', '🔓 Misión desbloqueada', `¡Misión desbloqueada: ${missionTitle}!`);
            }
          }
        });
      });
    }, 1000);

    // Clases: botón cancelar
    document.querySelectorAll<HTMLButtonElement>(".cancel-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const row = this.closest(".table-row");
        const teacher = row?.querySelector(".teacher-name")?.textContent;
        if (confirm(`¿Cancelar clase con ${teacher}?`)) {
          row?.remove();
        }
      });
    });
  }, []);
};
