// Iconos para Undo/Redo que Quill no trae por defecto en la toolbar
const CustomUndo = () => (
  <svg viewBox="0 0 18 18" className="w-4 h-4 fill-current text-gray-600">
    <polygon points="6 10 4 12 2 10 6 10" />
    <path d="M8,11a3.5,3.5,0,0,1,3.5-3.5h1l-2-2-1,3h2a2,2,0,0,0-2,2Z" />
  </svg>
);
const CustomRedo = () => (
  <svg viewBox="0 0 18 18" className="w-4 h-4 fill-current text-gray-600">
    <polygon points="12 10 14 12 16 10 12 10" />
    <path d="M10,11a3.5,3.5,0,0,0-3.5-3.5h-1l2-2,1,3h-2a2,2,0,0,1,2,2Z" />
  </svg>
);

// Componente de Barra de Herramientas Personalizada
const CustomToolbar = ({ id }: { id: string }) => (
  <div id={id} className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-white border-b border-gray-200 px-3 py-2 rounded-t-lg">
    {/* Grupo 1: Undo/Redo */}
    <span className="ql-formats flex gap-1">
      <button className="ql-undo hover:bg-gray-100 rounded" title="Deshacer">
        <CustomUndo />
      </button>
      <button className="ql-redo hover:bg-gray-100 rounded" title="Rehacer">
        <CustomRedo />
      </button>
    </span>

    {/* Separador */}
    <div className="h-5 w-px bg-gray-300 mx-1"></div>

    {/* Grupo 2: Fuente y Tamaño */}
    <span className="ql-formats flex gap-2">
      <select className="ql-font w-24" defaultValue="arial">
        <option value="arial">Arial</option>
        <option value="comic-sans">Comic Sans</option>
        <option value="courier-new">Courier New</option>
        <option value="georgia">Georgia</option>
        <option value="helvetica">Helvetica</option>
        <option value="lucida">Lucida</option>
      </select>
      <select className="ql-size w-20" defaultValue="medium">
        <option value="small">12px</option>
        <option value="medium">16px</option>
        <option value="large">20px</option>
        <option value="huge">24px</option>
      </select>
    </span>

    <div className="h-5 w-px bg-gray-300 mx-1"></div>

    {/* Grupo 3: Color y Resaltado con etiquetas */}
    <span className="ql-formats flex items-center gap-2">
      <span className="text-xs text-gray-500 font-medium">Color:</span>
      <select className="ql-color" />
      <span className="text-xs text-gray-500 font-medium ml-2">Resaltar:</span>
      <select className="ql-background" />
    </span>

    <div className="h-5 w-px bg-gray-300 mx-1"></div>

    {/* Grupo 4: Formatos Básicos */}
    <span className="ql-formats flex gap-1">
      <button className="ql-bold" />
      <button className="ql-italic" />
      <button className="ql-underline" />
      <button className="ql-strike" />
    </span>

    <div className="h-5 w-px bg-gray-300 mx-1"></div>

    {/* Grupo 5: Alineación */}
    <span className="ql-formats flex gap-1">
      <button className="ql-align" value="" />
      <button className="ql-align" value="center" />
      <button className="ql-align" value="right" />
      <button className="ql-align" value="justify" />
    </span>

    <div className="h-5 w-px bg-gray-300 mx-1"></div>

    {/* Grupo 6: Matemáticas (Símbolos) */}
    <span className="ql-formats flex gap-1">
      {/* a/b y raiz cuadrada se manejan via Formula en Quill estándar, pero agregamos script super/sub */}
      <button className="ql-script" value="sub" title="Subíndice" />
      <button className="ql-script" value="super" title="Superíndice" />
      <button className="ql-formula" title="Insertar Fórmula (Fractions, Roots, Symbols)" />
    </span>
  </div>
);