---
layout: ../../../layouts/BlogPost.astro
locale: es
title: "¡Histórico: interrupciones de Microsoft!"
description: La pantalla azul de la muerte ha aparecido en los dispositivos de distintas empresas.
slug: historical-windows-outages
image: /images/microsoft-outage.png
date: "2024-07-19"
tags: []
type: default
---

<h1 id="historical-microsoft-outages">¡Histórico: interrupciones de Microsoft!</h1>

Hoy vivimos una jornada tecnológica increíble e inesperada. Al comenzar el día, muchos ordenadores mostraron la pantalla azul de la muerte (BSOD). Se vieron afectados gobiernos, empresas sanitarias, plataformas comerciales, bancos, aeropuertos y otros sectores.

<h2 id="how-did-it-happen-this">¿Cómo ocurrió?</h2>

Este increíble incidente se produjo por la empresa de ciberseguridad «CrowdStrike», que proporciona software antivirus para Windows y otras empresas. Durante esta terrible jornada tecnológica, Microsoft declaró en las redes sociales: «La causa subyacente se ha solucionado; sin embargo, el impacto residual sigue afectando a algunas aplicaciones y servicios de Microsoft 365. Estamos realizando medidas de mitigación adicionales para aliviar la situación». Asimismo, Kurtz, director ejecutivo de CrowdStrike, afirmó: «CrowdStrike está trabajando activamente con los clientes afectados por un defecto detectado en una única actualización de contenido para equipos Windows. Los equipos Mac y Linux no están afectados».

Ante la preocupación de numerosos gobiernos de que el problema se debiera a un ciberataque, la empresa también declaró: «No se trata de un incidente de seguridad ni de un ciberataque. El problema se ha identificado, aislado y se ha implementado una solución».

<h4 id="details">Detalles</h4>

La actualización de seguridad de CrowdStrike instaló su producto llamado Falcon Sensor, un sensor de red para detectar y prevenir amenazas. Esa mañana, la empresa utilizó este parche para prevenir amenazas de ciberataques.

Después, la plataforma en la nube Azure de Microsoft sufrió un fallo que afectó a algunas empresas y bloqueó el acceso a sus aplicaciones de almacenamiento y a Microsoft 365. A las 4:09 (UTC), las máquinas virtuales Windows se reiniciaban y fallaban. Google fue la primera en informar e identificó que el problema era CrowdStrike.

Por los motivos mencionados, quizá tus ordenadores personales no se hayan visto afectados, ya que solo se vieron afectados los usuarios de Windows 365 y de servicios similares de Windows en la nube.

<h4 id="how-are-companies-affected">¿Cómo afecta a las empresas?</h4>

Muchas empresas han tenido que detener sus operaciones diarias porque era imposible trabajar y resolver el problema al instante. Los clientes del servicio de Windows están muy preocupados, ya que se han suspendido servicios importantes, como la asistencia médica, las transacciones bancarias, los viajes y los medios de comunicación. El prestigioso medio británico «Sky News» mostró un mensaje indicando que la transmisión estaba suspendida.

Estos son algunos titulares sobre los servicios afectados:

- Unos 1.500 vuelos en Estados Unidos cancelados a última hora de la mañana, según FlightAware.

- Algunas cadenas de televisión estadounidenses no pudieron emitir las noticias locales.

- Universal Studios Japan informa de que la venta de entradas está afectada.

- Jetstar de Japón cancela principalmente vuelos nacionales.

- Más de 100 vuelos cancelados en los aeropuertos de Nueva York.

Si quieres leer más información sobre los problemas, estos son los enlaces:

- [https://apnews.com/live/internet-global-outage-crowdstrike-microsoft-downtime](https://apnews.com/live/internet-global-outage-crowdstrike-microsoft-downtime)

- [https://www.bbc.com/news/live/cnk4jdwp49et](https://www.bbc.com/news/live/cnk4jdwp49et)

<h2 id="who-are-crowdstrike">¿Quién es CrowdStrike?</h2>

Ahora sabemos quiénes son los responsables de las interrupciones globales, pero es relevante añadir que tienen una gran experiencia y cuentan con la confianza del Gobierno de Estados Unidos en la defensa frente a ciberataques importantes. Han participado en la defensa de Estados Unidos contra ataques de hackers militares chinos y rusos. También colaboran con otros sistemas operativos conocidos, como Linux y MacOS.

Tenían una buena reputación entre empresas de alto perfil, como Sony; quizá su reputación se vea afectada después de este grave incidente global.

Es increíble cómo una simple actualización ha afectado a miles de máquinas. Cuando las empresas más importantes empezaron a sufrir incidentes con la BSOD, les sorprendió que CrowdStrike tuviera un mensaje predefinido, debido a la gran cantidad de solicitudes procedentes de todo el mundo. La empresa comunicó que reconocía la situación y que estaba trabajando intensamente para resolverla.

<h2 id="how-can-bsod-be-fixed">¿Cómo se puede solucionar la BSOD?</h2>

Actualmente, todos los dispositivos afectados deben resolver el problema manualmente mediante este proceso: cómo solucionar la pantalla azul de la muerte y el bucle de «Recuperación» y «Parece que Windows no se cargó correctamente» causado por CrowdStrike.

<h4 id="use-safe-mode-and-delete-the-affected-file">Utilizar el modo seguro y eliminar el archivo afectado</h4>

1. Debes iniciar en modo seguro para seguir el proceso. Si estás en la pantalla de recuperación, haz clic en «Ver opciones de reparación avanzadas». En el menú de opciones de reparación avanzadas, selecciona «Solucionar problemas» y después «Opciones avanzadas». Selecciona «Configuración de inicio» y haz clic en «Reiniciar». Cuando el equipo se reinicie, pulsa 4 o F4 para iniciarlo en modo seguro. Como alternativa, también puedes apagar el equipo, encenderlo y pulsar F8 repetidamente hasta que aparezca el menú de opciones de arranque avanzadas. Desde allí, selecciona el modo seguro.

1. En modo seguro, abre el símbolo del sistema como administrador o Windows PowerShell como administrador.

1. En el símbolo del sistema, escribe el siguiente comando para acceder al directorio de CrowdStrike: ***cd  C:\Windows\System32\drivers\CrowdStrike***

1. Para eliminar el archivo afectado, debes localizar el archivo que coincide con el patrón C-00000291*.sys.

1. Primero, ejecuta el siguiente comando para encontrar el archivo que coincide con el patrón: ***dir C-00000291*.sys.***

1. Una vez identificado el archivo, elimínalo utilizando: ***del C-00000291.sys***.

Encontrarás más información sobre la solución en este enlace: [https://www.windowslatest.com/2024/07/19/windows-10-crashes-with-bsod-stuck-at-recovery-due-to-crowdstrike-update/](https://www.windowslatest.com/2024/07/19/windows-10-crashes-with-bsod-stuck-at-recovery-due-to-crowdstrike-update/)

<h4 id="another-method-using-code-in-github">Otro método mediante código en GitHub</h4>

Se ha creado una solución de código abierto que puedes consultar y aplicar para ahorrar tiempo. Esta opción todavía no se ha probado para comprobar su eficacia real. Puedes obtenerla en este repositorio: [https://github.com/panxos/CrowdStrike-rollback](https://github.com/panxos/CrowdStrike-rollback)

<h2 id="conclusion">Conclusión</h2>

De hecho, las principales interrupciones tecnológicas todavía no se han resuelto y muchos expertos han señalado que las consecuencias podrían ser graves. Algunas personas afirmaron que las acciones de CrowdStrike podrían caer más de un 15 % en bolsa y que la empresa también podría perder reputación. Ha sido un día horrible para el mundo, con mucho caos e incertidumbre entre los clientes y la población en general. Es necesario plantearse estas preguntas: ¿Cuánto podemos depender del software? ¿Cómo pudo un simple código afectar a todo el mundo? En mi opinión, es complicado encontrar la respuesta.

Comunicados oficiales de CrowdStrike:

- [https://www.crowdstrike.com/blog/statement-on-falcon-content-update-for-windows-hosts/](https://www.crowdstrike.com/blog/statement-on-falcon-content-update-for-windows-hosts/)

- [https://x.com/George_Kurtz/status/1814235001745027317](https://x.com/George_Kurtz/status/1814235001745027317)

Algunos artículos de medios digitales:

- [https://www.nbcnews.com/tech/tech-news/microsoft-blue-screen-of-death-global-outage-rcna162674](https://www.nbcnews.com/tech/tech-news/microsoft-blue-screen-of-death-global-outage-rcna162674)

- [https://www.theguardian.com/australia-news/article/2024/jul/19/microsoft-windows-pcs-outage-blue-screen-of-death](https://www.theguardian.com/australia-news/article/2024/jul/19/microsoft-windows-pcs-outage-blue-screen-of-death)

- [https://www.nytimes.com/2024/07/19/business/microsoft-outage-cause-azure-crowdstrike.html](https://www.nytimes.com/2024/07/19/business/microsoft-outage-cause-azure-crowdstrike.html)

- [https://www.theverge.com/2024/7/19/24201806/microsoft-windows-bsod-pc-crashing-crowdstrike-fix](https://www.theverge.com/2024/7/19/24201806/microsoft-windows-bsod-pc-crashing-crowdstrike-fix)

- [https://www.cbsnews.com/news/microsoft-internet-outages-reported-worldwide/](https://www.cbsnews.com/news/microsoft-internet-outages-reported-worldwide/)
