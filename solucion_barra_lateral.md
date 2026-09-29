# Guía: Solución a la Barra Lateral (Sidebar) Oculta

## Problema detectado
Al reducir el tamaño de la ventana (o al ver la aplicación en dispositivos móviles), la barra lateral desaparece por completo. Este es el comportamiento esperado del diseño responsivo para liberar espacio, pero falta un mecanismo (botón) para que el usuario pueda volver a desplegar el menú.

## Solución: Implementar un Menú Colapsable (Offcanvas / Drawer)

A continuación, se detallan los pasos estructurales para resolver este problema:

### 1. Agregar un Botón de Menú (Hamburguesa ☰)
Debes insertar un botón de control en la vista de ventana reducida.
* **Ubicación ideal:** En la barra superior (cabecera), justo a la izquierda del texto "Inicio" o "SIGMA".
* **Visibilidad:** Este botón debe estar oculto en pantallas grandes (escritorio) y visible únicamente en resoluciones menores. Esto se logra utilizando *Media Queries* en CSS.

### 2. Modificar el CSS de la Barra Lateral
Es importante evitar el uso de `display: none;` para ocultar la barra en pantallas pequeñas, ya que imposibilita la creación de animaciones fluidas al abrirla. En su lugar, utiliza posicionamiento y transformaciones:

```css
/* Ejemplo genérico para pantallas menores a 768px */
@media (max-width: 768px) {
  .sidebar-container {
    /* Fija la barra en la pantalla */
    position: fixed;
    z-index: 1050; /* Debe estar por encima de otros elementos */
    left: 0;
    top: 0;
    height: 100vh;
    
    /* Oculta la barra desplazándola fuera de la vista hacia la izquierda */
    transform: translateX(-100%); 
    transition: transform 0.3s ease-in-out;
  }

  /* Clase modificadora que se agregará dinámicamente para mostrar el menú */
  .sidebar-container.is-open {
    transform: translateX(0);
  }
}
```

### 3. Implementar la Lógica de Apertura y Cierre
Necesitas un script (JavaScript vanilla o las herramientas de tu framework) para controlar cuándo se muestra el menú.

* **El Toggle:** Crea una función que escuche el evento `click` del botón de hamburguesa y alterne (añada o quite) la clase `.is-open` en el contenedor de la barra lateral.
* **Mejora de Experiencia de Usuario (UX) - El Overlay:** Cuando el menú esté abierto en dispositivos móviles, es muy recomendable renderizar una capa oscura semitransparente (overlay) sobre el resto de la aplicación (el contenido principal). Si el usuario hace clic en ese overlay, el menú debe cerrarse (removiendo la clase `.is-open`).

### 4. Alternativa con Librerías UI (Recomendado)
Si el sistema SIGMA está construido utilizando algún framework de componentes CSS o JS (como Bootstrap, Material-UI, Tailwind UI, Vuetify, etc.), no es necesario que programes esto desde cero.

* **Qué buscar:** Revisa la documentación de tu librería y busca el componente llamado **"Offcanvas"**, **"Drawer"**, o **"Navigation Drawer"**. 
* **Ventaja:** Estos componentes ya traen resuelta la lógica del botón, la animación responsiva, la accesibilidad y el fondo superpuesto (overlay).