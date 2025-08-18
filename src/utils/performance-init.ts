/**
 * Otimizações de performance específicas para o módulo de atendimento
 */

// Otimizações específicas do atendimento
export function initAttendancePerformanceOptimizations() {
  // Detectar tipo de dispositivo para otimizações específicas
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  
  if (isMobile || isLowEndDevice) {
    document.documentElement.classList.add('low-end-device');
    
    // Reduzir animações em dispositivos de baixo desempenho
    const style = document.createElement('style');
    style.textContent = `
      .low-end-device * {
        animation-duration: 0.1s !important;
        animation-delay: 0s !important;
        transition-duration: 0.1s !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Preload de ícones críticos do atendimento
  const criticalIcons = [
    '/icons/whatsapp.svg',
    '/icons/message.svg',
    '/icons/user.svg',
    '/icons/phone.svg'
  ];

  criticalIcons.forEach(icon => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = icon;
    document.head.appendChild(link);
  });

  // Otimizar para conexões lentas
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
      document.documentElement.classList.add('slow-connection');
    }
  }

  console.log('📞 Attendance performance optimizations applied');
}

// Aplicar otimizações baseadas na capacidade do dispositivo
export function applyPerformanceBasedOptimizations() {
  // Otimizações de memória
  if ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 4) {
    document.documentElement.classList.add('low-memory');
    
    // Limitar cache de imagens
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (index > 20) { // Manter apenas 20 imagens na memória
        img.loading = 'lazy';
      }
    });
  }

  // Otimizações de CPU
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
    document.documentElement.classList.add('low-cpu');
    
    // Reduzir frequência de atualizações em tempo real
    (window as any).REALTIME_UPDATE_INTERVAL = 5000; // 5 segundos em vez de 1
  }

  // Otimizações de bateria
  if ('getBattery' in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      if (battery.level < 0.2) {
        document.documentElement.classList.add('low-battery');
        
        // Reduzir animações e polling
        (window as any).BATTERY_SAVE_MODE = true;
      }
      
      battery.addEventListener('levelchange', () => {
        if (battery.level < 0.2) {
          document.documentElement.classList.add('low-battery');
          (window as any).BATTERY_SAVE_MODE = true;
        } else {
          document.documentElement.classList.remove('low-battery');
          (window as any).BATTERY_SAVE_MODE = false;
        }
      });
    }).catch(() => {
      // Battery API não suportada
    });
  }

  console.log('⚡ Performance-based optimizations applied');
}