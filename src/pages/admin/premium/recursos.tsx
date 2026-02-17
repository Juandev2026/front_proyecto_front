import React, { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { 
  PlusIcon,
  DocumentTextIcon, 
  TrashIcon, 
  PencilIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MenuIcon,
  DownloadIcon,
  EyeIcon,
  UploadIcon,
  XIcon
} from '@heroicons/react/outline';

// --- TYPES ---
interface Resource {
  id: number;
  title: string;
  filename: string;
  size: string;
  type: 'PDF' | 'VIDEO' | 'LINK';
  url: string;
}

interface Subsection {
  id: number;
  title: string;
  resources: Resource[];
}

interface Section {
  id: number;
  title: string;
  subsections: Subsection[];
}

interface IntroContent {
  title: string;
  description: string;
  videoUrl: string;
}

// --- MOCK DATA ---
const initialSections: Section[] = [
  {
    id: 1,
    title: 'TEMARIO INICIAL',
    subsections: [
      {
        id: 101,
        title: 'INICIAL',
        resources: [
            { id: 1001, title: 'Temario_EBR_Inicial_A25.pdf', filename: 'Temario_EBR_Inicial_A25_AF_LCCG_HG.pdf', size: '274.7 KB', type: 'PDF', url: '#' }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'MODIFICATORIA DE CRONOGRAMA',
    subsections: [
         {
        id: 201,
        title: 'Normativa General',
        resources: []
      }
    ]
  },
  {
    id: 3,
    title: 'NORMATIVIDAD - PROCESOS',
    subsections: []
  },
    {
    id: 4,
    title: 'NUEVOS PROTOCOLOS DE ATENCIÓN SISEVE',
    subsections: []
  },
];

const Recursos = () => {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [expandedSections, setExpandedSections] = useState<number[]>([1]); // Default first open
  const [expandedSubsections, setExpandedSubsections] = useState<number[]>([101]);

  // Intro Content State
  const [introContent, setIntroContent] = useState<IntroContent>({
    title: '¿CÓMO NAVEGAR EN ESCALA DOCENTE?',
    description: 'Se vienen nuevas implementaciones para ASCENSO, DIRECTIVO Y NOMBRAMIENTO. PRONTO: GENERADORES DE PROMPT PARA SESIONES Y COMUNIDAD VIP.',
    videoUrl: 'https://youtube.com/shorts/w54preUQrN4?feature=share'
  });
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const [editingIntro, setEditingIntro] = useState<IntroContent>({ title: '', description: '', videoUrl: '' });

  const handleOpenIntroModal = () => {
    setEditingIntro({ ...introContent });
    setIsIntroModalOpen(true);
  };

  const handleSaveIntro = () => {
    setIntroContent(editingIntro);
    setIsIntroModalOpen(false);
  };

  const toggleSection = (id: number) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSubsection = (id: number) => {
    setExpandedSubsections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Stats
  const totalSections = sections.length;
  const totalSubsections = sections.reduce((acc, s) => acc + s.subsections.length, 0);
  const totalFiles = sections.reduce((acc, s) => acc + s.subsections.reduce((acc2, sub) => acc2 + sub.resources.length, 0), 0);

  return (
    <AdminLayout>
      {/* --- HEADER --- */}
      <div className="bg-primary text-white p-6 rounded-t-lg mb-6 flex justify-center items-center shadow-lg">
        <h1 className="text-2xl font-bold">Repositorio de Contenidos Multimedia</h1>
      </div>

      {/* --- INFO BOX --- */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
        <div className="mr-2 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <p className="text-blue-800 text-sm">
          <span className="font-bold">Consejo:</span> Puedes reordenar las secciones y subsecciones arrastrándolas con el ícono de líneas paralelas.
        </p>
      </div>

       {/* --- ACTIONS HEADER --- */}
      <div className="flex gap-4 mb-8">
        <button className="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md transition-colors">
            <PlusIcon className="w-5 h-5 mr-2" />
            Nueva sección
        </button>

        <button 
            onClick={handleOpenIntroModal}
            className="bg-white hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded-lg border border-gray-300 flex items-center shadow-sm transition-colors"
        >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Contenido intro
        </button>
      </div>

      {/* --- STATS CARDS --- */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-800 mb-1">{totalSections}</span>
            <span className="text-gray-500 font-medium">Secciones</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
             <span className="text-4xl font-bold text-gray-800 mb-1">{totalSubsections}</span>
            <span className="text-gray-500 font-medium">Subsecciones</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
             <span className="text-4xl font-bold text-gray-800 mb-1">{totalFiles}</span>
            <span className="text-gray-500 font-medium">Archivos PDF</span>
        </div>
      </div>

      {/* --- INTRO CARD --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-4 right-4">
             <button className="text-red-400 hover:text-red-600 p-1"><TrashIcon className="w-5 h-5"/></button>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full mb-3 inline-block">Contenido Intro</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{introContent.title}</h2>
        <p className="text-gray-600 text-sm mb-6 max-w-2xl">
            {introContent.description}
        </p>
        <div className="flex gap-3">
             <button className="flex-1 max-w-xs bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors">
                <EyeIcon className="w-4 h-4 mr-2" /> Ver
            </button>
             <button className="flex-1 max-w-xs bg-primary text-white hover:bg-blue-600 font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors">
                <DownloadIcon className="w-4 h-4 mr-2" /> Descargar
            </button>
        </div>
      </div>

      {/* --- SECTIONS LIST --- */}
      <div className="space-y-4">
        {sections.map(section => (
            <div key={section.id} className="bg-white rounded-lg border border-primary/30 shadow-sm overflow-hidden">
                {/* Section Header */}
                <div className="p-4 flex items-center justify-between bg-white">
                    <div className="flex items-center flex-1">
                        <MenuIcon className="w-5 h-5 text-gray-400 mr-4 cursor-move" />
                        <button 
                            onClick={() => toggleSection(section.id)}
                            className="mr-3 text-gray-500 hover:text-primary transition-colors focus:outline-none"
                        >
                            {expandedSections.includes(section.id) ? (
                                <ChevronDownIcon className="w-5 h-5" />
                            ) : (
                                <ChevronRightIcon className="w-5 h-5" />
                            )}
                        </button>
                        <div>
                             <h3 className="text-lg font-bold text-gray-800 uppercase">{section.title}</h3>
                             <p className="text-xs text-gray-500 mt-0.5">{section.subsections.length} subsecciones • {section.subsections.reduce((a,s) => a + s.resources.length, 0)} recursos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="bg-primary hover:bg-blue-600 text-white text-sm font-medium py-1.5 px-3 rounded flex items-center transition-colors">
                            <PlusIcon className="w-4 h-4 mr-1" /> Añadir Subsección
                        </button>
                         <button className="text-gray-500 hover:text-blue-600 p-2 border border-gray-200 rounded bg-white transition-colors">
                            <PencilIcon className="w-4 h-4" />
                        </button>
                         <button className="text-gray-500 hover:text-red-500 p-2 border border-gray-200 rounded bg-white transition-colors">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Subsections */}
                {expandedSections.includes(section.id) && (
                    <div className="bg-gray-50/50 p-4 border-t border-gray-100 space-y-4">
                        {section.subsections.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 text-sm italic">
                                No hay subsecciones todavía. ¡Crea una!
                            </div>
                        ) : (
                            section.subsections.map(sub => (
                                <div key={sub.id} className="border border-gray-200 rounded-lg bg-white ml-0 md:ml-8">
                                     {/* Subsection Header */}
                                     <div className="p-3 flex items-center justify-between border-b border-gray-100">
                                         <div className="flex items-center">
                                            <MenuIcon className="w-4 h-4 text-gray-300 mr-3 cursor-move" />
                                            <button 
                                                onClick={() => toggleSubsection(sub.id)}
                                                className="mr-2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
                                            >
                                                {expandedSubsections.includes(sub.id) ? (
                                                    <ChevronDownIcon className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRightIcon className="w-4 h-4" />
                                                )}
                                            </button>
                                            <span className="font-bold text-gray-700">{sub.title}</span>
                                            <span className="ml-2 text-xs text-gray-400">{sub.resources.length} documentos disponibles</span>
                                         </div>
                                         <div className="flex items-center gap-2">
                                            <button className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-1.5 px-3 rounded flex items-center transition-colors">
                                                <UploadIcon className="w-3 h-3 mr-1" /> Subir PDF libre
                                            </button>
                                            <button className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium py-1.5 px-3 rounded flex items-center transition-colors">
                                                <UploadIcon className="w-3 h-3 mr-1" /> Subir PDF premium
                                            </button>
                                             <button className="text-gray-500 hover:text-blue-600 p-1.5 border border-gray-200 rounded bg-white transition-colors">
                                                <PencilIcon className="w-3.5 h-3.5" />
                                            </button>
                                             <button className="text-gray-500 hover:text-red-500 p-1.5 border border-gray-200 rounded bg-white transition-colors">
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                         </div>
                                     </div>

                                     {/* Resources List */}
                                     {expandedSubsections.includes(sub.id) && (
                                         <div className="p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                             {sub.resources.map(res => (
                                                <div key={res.id} className="bg-white rounded-lg border border-green-200 shadow-sm p-4 relative">
                                                    <div className="absolute top-2 right-2 flex gap-1">
                                                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-500"><PencilIcon className="w-3 h-3"/></button>
                                                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"><TrashIcon className="w-3 h-3"/></button>
                                                    </div>
                                                    <div className="flex flex-col h-full">
                                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded w-max mb-3">PDF</span>
                                                        <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">{res.title}</h4>
                                                        <p className="text-gray-500 text-xs mb-4 line-clamp-1">{res.filename}</p>
                                                        <span className="text-gray-400 text-xs mb-4 block">{res.size}</span>
                                                        
                                                        <div className="mt-auto flex gap-2">
                                                            <button className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold py-1.5 rounded flex items-center justify-center transition-colors">
                                                                <EyeIcon className="w-3 h-3 mr-1" /> Ver
                                                            </button>
                                                            <button className="flex-1 bg-primary hover:bg-blue-600 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center transition-colors">
                                                                <DownloadIcon className="w-3 h-3 mr-1" /> Descargar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                             ))}
                                             {sub.resources.length === 0 && (
                                                 <div className="col-span-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400 text-sm">
                                                     No hay recursos en esta subsección. Sube un PDF.
                                                 </div>
                                             )}
                                         </div>
                                     )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        ))}
      </div>

      {/* Intro Modal */}
      {isIntroModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Contenido de Introducción</h3>
                    <button onClick={() => setIsIntroModalOpen(false)} className="bg-red-500 rounded-full p-1 text-white hover:bg-red-600">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-500 mb-4">
                        Configure el contenido de introducción del módulo con nombre, descripción y URL del video
                    </p>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del módulo *</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={editingIntro.title}
                            onChange={(e) => setEditingIntro({...editingIntro, title: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                        <textarea 
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            value={editingIntro.description}
                            onChange={(e) => setEditingIntro({...editingIntro, description: e.target.value})}
                        />
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL del video *</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={editingIntro.videoUrl}
                            onChange={(e) => setEditingIntro({...editingIntro, videoUrl: e.target.value})}
                        />
                        <p className="text-xs text-gray-400 mt-1">Ingrese la URL completa del video de introducción</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <span className="text-blue-600 font-bold text-xs block mb-1">Configuración actual:</span>
                        <div className="text-xs space-y-1">
                             <p><span className="font-bold text-blue-700">Nombre:</span> <span className="text-blue-600">{introContent.title}</span></p>
                             <p><span className="font-bold text-blue-700">Descripción:</span> <span className="text-blue-600">{introContent.description}</span></p>
                             <p><span className="font-bold text-blue-700">URL:</span> <span className="text-blue-600 truncate block">{introContent.videoUrl}</span></p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
                     <button 
                        onClick={() => setIsIntroModalOpen(false)}
                        className="text-gray-700 font-medium py-2 px-6 rounded-lg border border-gray-300 hover:bg-white bg-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSaveIntro}
                        className="bg-blue-900 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-800 transition-colors"
                    >
                        Actualizar Contenido
                    </button>
                </div>
            </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default Recursos;
