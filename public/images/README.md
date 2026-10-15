# Fotografía del banner

Fotografía panorámica nocturna de Bogotá utilizada en el banner de Panorama territorial:

- Recurso del banner: `public/images/bogota_urbana-mejorada.webp` (2058 × 764 px, aproximadamente 654 KiB).
- Original conservado: `public/images/bogota_urbana.jpg` (738 × 270 px, 58.899 bytes). Estas son las dimensiones reales del archivo, tanto en su encabezado JPEG como en el navegador.
- La copia mejorada se generó con la herramienta integrada `image_gen`, siguiendo la habilidad `imagegen`, y se convirtió a WebP con calidad 0,92. La generación aumenta el detalle aparente; puede reconstruir detalles y no equivale a recuperar una foto original de alta resolución.
- La avenida iluminada está aproximadamente al centro: el banner usa `object-fit: cover` y `object-position: 50% 58%`.

El componente utiliza la ruta base de Nuxt para funcionar también cuando el sitio se publica en una subruta. El fondo azul oscuro permanece como respaldo durante la carga de la fotografía.

Prompt utilizado para la mejora:

> Edit target: the provided real photograph of downtown Bogota at dusk, source 738x270. Task: conservative high fidelity resolution enhancement and JPEG artifact cleanup for a website panorama banner. Produce a high resolution panorama approximately 2040x758 or larger with EXACTLY the same approximately 2.73:1 composition. Preserve the exact city, landmark buildings, tower positions, illuminated central avenue, circular bullring in bottom right, mountain silhouette, lighting, dusk blue/gold colors and perspective. Improve perceived detail, reduce compression artifacts and gently sharpen existing edges. Do not redesign the city, do not add buildings, vehicles, readable signs, additional lights, sky features, textures or objects; do not crop or change framing or time of day. No text, graphics, logo or overlay. Keep the original photographic character, natural fine detail, no painterly/CGI look, no aggressive sharpening halos. This is an image restoration for a real geographic dashboard, not a creative reimagining. Save the generated restoration as a local file so it can be copied to the project as a separate higher resolution asset.
