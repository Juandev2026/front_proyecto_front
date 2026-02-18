import React, { useState, useEffect } from 'react';
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
import { seccionesService } from '../../../services/seccionesService';
import { seccionRecursosService } from '../../../services/seccionRecursosService';
import { contenidoIntroductorioService } from '../../../services/contenidoIntroductorioService';
import { uploadService } from '../../../services/uploadService';
import { materialService } from '../../../services/materialService';
import { seccionRelacionService } from '../../../services/seccionRelacionService';

// --- TYPES ---
interface Resource {
  idSeccionGestion: number;
  idSubSeccion: number;
  pdf: string;
  imagen: string;
  nombreArchivo: string;
  numero: number;
  materialId: number; // Added to track actual material ID
}

interface Subsection {
  id: number;
  nombre: string;
  descripcion: string;
  recursos: Resource[];
}

interface Section {
  id: number;
  nombre: string;
  descripcion: string;
  subSecciones: Subsection[];
}

interface IntroContent {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
}

// --- MOCK DATA FOR SECTIONS ---
const initialSections: Section[] = [];

const Recursos = () => {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [expandedSections, setExpandedSections] = useState<number[]>([1]);
  const [expandedSubsections, setExpandedSubsections] = useState<number[]>([101]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    secciones: 0,
    subsecciones: 0,
    archivosPdf: 0
  });

  // Intro Content State
  const [introContent, setIntroContent] = useState<IntroContent>({
    id: 1,
    title: '¿CÓMO NAVEGAR EN ESCALA DOCENTE?',
    description: 'Se vienen nuevas implementaciones para ASCENSO, DIRECTIVO Y NOMBRAMIENTO.',
    videoUrl: 'https://youtube.com/shorts/w54preUQrN4?feature=share'
  });
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const [editingIntro, setEditingIntro] = useState<IntroContent>({ id: 0, title: '', description: '', videoUrl: '' });

  // New Section Modal State
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [newSection, setNewSection] = useState({
    nombre: '',
    descripcion: ''
  });

  // New Subsection Modal State
  const [isAddSubsectionModalOpen, setIsAddSubsectionModalOpen] = useState(false);
  const [newSubsection, setNewSubsection] = useState({
    nombre: '',
    sectionId: 0
  });

  // New Resource Modal State
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newResource, setNewResource] = useState({
    idSeccion: 0,
    idSubSeccion: 0,
    nombreArchivo: '',
    pdf: '',
    imagen: ''
  });

  const fetchIntroContent = async () => {
    try {
      const data = await contenidoIntroductorioService.getAll();
      const firstItem = data[0];
      if (firstItem) {
        setIntroContent({
          id: firstItem.id,
          title: firstItem.nombreModulo,
          description: firstItem.descripcion,
          videoUrl: firstItem.urlVideo
        });
      }
    } catch (error) {
      console.error("Error fetching intro content:", error);
    }
  };

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      // 1. Get Nested Data (Tree Structure)
      const sectionsData = await seccionRecursosService.getDatosAnidados();
      console.log("DATOS ANIDADOS RAW:", sectionsData);

      // Map to internal state structure (if needed, but SeccionAnidada is very similar)
      const mappedSections: Section[] = sectionsData.map((s: any) => ({
        id: s.id,
        nombre: s.nombre,
        descripcion: s.descripcion || '',
        subSecciones: s.subSecciones.map((sub: any) => {
          // The API might return 'recurso' (singular) or 'recursos' (array)
          let recursosArray: Resource[] = [];
          if (Array.isArray(sub.recursos)) {
            recursosArray = sub.recursos;
          } else if (sub.recurso) {
            recursosArray = [sub.recurso];
          }

          return {
            id: sub.id,
            nombre: sub.nombre,
            descripcion: sub.descripcion || '',
            recursos: recursosArray
          };
        })
      }));

      setSections(mappedSections);

      // Calculate stats
      let totalSubsections = 0;
      let totalResources = 0;
      mappedSections.forEach(s => {
        totalSubsections += s.subSecciones.length;
        s.subSecciones.forEach(sub => {
          totalResources += sub.recursos.length;
        });
      });

      setStats({
        secciones: mappedSections.length,
        subsecciones: totalSubsections,
        archivosPdf: totalResources
      });

    } catch (error) {
      console.error("Error fetching nested sections and resources:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntroContent();
    fetchSections();
  }, []);

  const handleOpenIntroModal = () => {
    setEditingIntro({ ...introContent });
    setIsIntroModalOpen(true);
  };

  const handleSaveIntro = async () => {
    if (!editingIntro.id) return;

    try {
      await contenidoIntroductorioService.update(editingIntro.id, {
        nombreModulo: editingIntro.title,
        descripcion: editingIntro.description,
        urlVideo: editingIntro.videoUrl
      });

      await fetchIntroContent();
      setIsIntroModalOpen(false);
      alert("Contenido de introducción actualizado correctamente.");
    } catch (error) {
      alert("Error al actualizar el contenido.");
    }
  };

  const handleCreateSection = async () => {
    if (!newSection.nombre) {
      alert("Por favor ingrese el nombre de la sección.");
      return;
    }

    try {
      await seccionesService.create({
        nombre: newSection.nombre,
        descripcion: newSection.descripcion
      });
      setIsAddSectionModalOpen(false);
      setNewSection({ nombre: '', descripcion: '' });
      await fetchSections();
      alert("Sección creada con éxito");
    } catch (error) {
      alert("Error al crear la sección.");
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta sección?")) return;
    try {
      await seccionesService.delete(id);
      await fetchSections();
      alert("Sección eliminada con éxito");
    } catch (error) {
      alert("Error al eliminar la sección.");
    }
  };

  const handleOpenAddResource = (seccionId: number, subSeccionId: number) => {
    setNewResource({
      idSeccion: seccionId,
      idSubSeccion: subSeccionId,
      nombreArchivo: '',
      pdf: '',
      imagen: ''
    });
    setIsAddResourceModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'imagen') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadService.uploadImage(file);
      setNewResource(prev => ({
        ...prev,
        [type]: url
      }));
    } catch (error) {
      console.error(error);
      alert("Error al subir el archivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateResource = async () => {
    if (!newResource.nombreArchivo || !newResource.pdf || !newResource.idSeccion || !newResource.idSubSeccion) {
      alert("Por favor complete los campos obligatorios (Nombre y PDF).");
      return;
    }

    try {
      setUploading(true);

      const payload = {
        titulo: newResource.nombreArchivo,
        descripcion: "Recurso de sección",
        url: newResource.pdf,
        imageUrl: newResource.imagen || '',
        archivoUrl: newResource.pdf,
        videoUrl: '',
        categoriaId: null, // Allow null as seen in existing materials
        modalidadId: null,
        nivelId: null,
        estadoId: 1,      // 'Publicado' as seen in working examples
        usuarioEdicionId: null,
        precio: 0,
        telefono: '999999999'
      };

      const material = await materialService.create(payload as any);

      // 2. Link it to the Section/Subsection
      await seccionRelacionService.create({
        idSeccion: newResource.idSeccion,
        idSubSeccion: newResource.idSubSeccion,
        materialId: material.id
      });

      console.log("Relación creada con éxito");

      setIsAddResourceModalOpen(false);
      await fetchSections();
      alert("Recurso registrado con éxito");
    } catch (error) {
      console.error(error);
      alert("Error al registrar el recurso: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setUploading(false);
    }
  };

  // Edit Section Modal State
  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState({ id: 0, nombre: '', descripcion: '' });

  // Edit Subsection Modal State
  const [isEditSubsectionModalOpen, setIsEditSubsectionModalOpen] = useState(false);
  const [editingSubsection, setEditingSubsection] = useState({ id: 0, nombre: '', sectionId: 0 });

  const handleCreateSubsection = async () => {
    if (!newSubsection.nombre || !newSubsection.sectionId) {
      alert("Por favor ingrese el nombre de la subsección.");
      return;
    }

    try {
      // 1. Create the Subsection entity (now trying to send seccionId in body)
      await seccionesService.createSubseccion(newSubsection.sectionId, newSubsection.nombre);

      setIsAddSubsectionModalOpen(false);
      setNewSubsection({ nombre: '', sectionId: 0 });
      await fetchSections();
      alert("Subsección creada con éxito.");
    } catch (error) {
      console.error(error);
      alert("Error al crear la subsección.");
    }
  };

  const handleOpenEditSection = (section: Section) => {
    setEditingSection({
      id: section.id,
      nombre: section.nombre,
      descripcion: section.descripcion
    });
    setIsEditSectionModalOpen(true);
  };

  const handleUpdateSection = async () => {
    if (!editingSection.nombre) {
      alert("Por favor ingrese el nombre de la sección.");
      return;
    }
    try {
      await seccionesService.update(editingSection.id, {
        nombre: editingSection.nombre,
        descripcion: editingSection.descripcion
      });
      setIsEditSectionModalOpen(false);
      await fetchSections();
      alert("Sección actualizada con éxito");
    } catch (error) {
      console.error(error);
      alert("Error al actualizar la sección.");
    }
  };

  const handleOpenEditSubsection = (sub: Subsection, sectionId: number) => {
    setEditingSubsection({
      id: sub.id,
      nombre: sub.nombre,
      sectionId: sectionId
    });
    setIsEditSubsectionModalOpen(true);
  };

  const handleUpdateSubsection = async () => {
    if (!editingSubsection.nombre) {
      alert("Por favor ingrese el nombre de la subsección.");
      return;
    }
    try {
      await seccionesService.updateSubseccion(editingSubsection.id, editingSubsection.nombre);
      setIsEditSubsectionModalOpen(false);
      await fetchSections();
      alert("Subsección actualizada con éxito");
    } catch (error) {
      console.error(error);
      alert("Error al actualizar la subsección.");
    }
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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* --- HEADER --- */}
      <div className="bg-primary text-white p-6 rounded-t-lg mb-6 flex justify-center items-center shadow-lg">
        <h1 className="text-2xl font-bold">Repositorio de Contenidos Multimedia</h1>
      </div>

      {/* --- SUBTITLE --- */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Modulo de Recursos</h2>

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
        <button
          onClick={() => setIsAddSectionModalOpen(true)}
          className="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md transition-colors"
        >
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
          <span className="text-4xl font-bold text-gray-800 mb-1">{stats.secciones}</span>
          <span className="text-gray-500 font-medium">Secciones</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-800 mb-1">{stats.subsecciones}</span>
          <span className="text-gray-500 font-medium">Subsecciones</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-800 mb-1">{stats.archivosPdf}</span>
          <span className="text-gray-500 font-medium">Archivos PDF</span>
        </div>
      </div>

      {/* --- INTRO CARD --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 relative overflow-hidden">
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full mb-3 inline-block">Contenido Intro</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{introContent.title}</h2>
        <p className="text-gray-600 text-sm mb-6 max-w-2xl text-left">
          {introContent.description}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.open(introContent.videoUrl, '_blank')}
            className="max-w-xs bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium py-2 px-8 rounded-lg flex items-center justify-center transition-colors"
          >
            <EyeIcon className="w-4 h-4 mr-2" /> Ver
          </button>
          <button
            className="max-w-xs bg-primary text-white border border-primary hover:bg-blue-700 font-medium py-2 px-8 rounded-lg flex items-center justify-center transition-colors shadow-sm"
          >
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
                  <h3 className="text-lg font-bold text-gray-800 uppercase">{section.nombre}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 text-left">{section.subSecciones.length} subsecciones • {section.subSecciones.reduce((a, s) => a + s.recursos.length, 0)} recursos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setNewSubsection({ ...newSubsection, sectionId: section.id });
                    setIsAddSubsectionModalOpen(true);
                  }}
                  className="bg-primary hover:bg-blue-600 text-sm font-medium py-1.5 px-3 rounded flex items-center transition-colors text-white"
                >
                  <PlusIcon className="w-4 h-4 mr-1" /> Añadir Subsección
                </button>
                <button
                  onClick={() => handleOpenEditSection(section)}
                  className="text-gray-500 hover:text-blue-600 p-2 border border-gray-200 rounded bg-white transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSection(section.id)}
                  className="text-gray-500 hover:text-red-500 p-2 border border-gray-200 rounded bg-white transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subsections */}
            {expandedSections.includes(section.id) && (
              <div className="bg-gray-100/30 p-4 border-t border-gray-100 space-y-4">
                {section.subSecciones.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm italic">
                    No hay subsecciones todavía. ¡Crea una!
                  </div>
                ) : (
                  section.subSecciones.map(sub => (
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
                          <span className="font-bold text-gray-700">{sub.nombre}</span>
                          <span className="ml-2 text-xs text-gray-400">{sub.recursos.length} documentos disponibles</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenAddResource(section.id, sub.id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1.5 px-3 rounded flex items-center transition-colors"
                          >
                            <UploadIcon className="w-3 h-3 mr-1" /> Subir PDF libre
                          </button>
                          <button
                            onClick={() => handleOpenAddResource(section.id, sub.id)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium py-1.5 px-3 rounded flex items-center transition-colors"
                          >
                            <UploadIcon className="w-3 h-3 mr-1" /> Subir PDF premium
                          </button>
                          <button
                            onClick={() => handleOpenEditSubsection(sub, section.id)}
                            className="text-gray-500 hover:text-blue-600 py-1.5 px-3 border border-gray-200 rounded bg-white transition-colors flex items-center text-sm font-medium"
                          >
                            <PencilIcon className="w-4 h-4 mr-1.5" /> Editar
                          </button>
                          <button className="text-gray-500 hover:text-red-500 p-1.5 border border-gray-200 rounded bg-white transition-colors">
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Resources List */}
                      {expandedSubsections.includes(sub.id) && (
                        <div className="p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sub.recursos.length === 0 ? (
                            <div className="col-span-full py-4 text-center text-gray-400 text-sm italic">
                              No hay recursos en esta subsección
                            </div>
                          ) : (
                            sub.recursos.map(res => (
                              <div key={res.numero} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 relative group">
                                <div className="absolute top-2 right-2 flex gap-1 bg-white p-1 rounded-md shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-blue-500"><PencilIcon className="w-3.5 h-3.5" /></button>
                                  <button className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-red-500"><TrashIcon className="w-3.5 h-3.5" /></button>
                                </div>
                                <div className="flex flex-col h-full">
                                  <div className="mb-3">
                                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">PDF</span>
                                  </div>

                                  {res.imagen ? (
                                    <div className="mb-4 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 h-32 flex items-center justify-center">
                                      <img src={res.imagen} alt={res.nombreArchivo} className="max-h-full object-contain" />
                                    </div>
                                  ) : (
                                    <div className="mb-4 rounded-lg overflow-hidden border border-gray-200 border-dashed bg-gray-50 h-32 flex items-center justify-center">
                                      <DocumentTextIcon className="w-10 h-10 text-gray-300" />
                                    </div>
                                  )}

                                  <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2 text-left">{res.nombreArchivo}</h4>
                                  <p className="text-gray-400 text-[11px] mb-4 truncate text-left">{res.pdf}</p>

                                  <div className="mt-auto flex gap-2">
                                    <button
                                      onClick={() => window.open(res.pdf, '_blank')}
                                      className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold py-2 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                                    >
                                      <EyeIcon className="w-3.5 h-3.5 mr-1.5" /> Ver
                                    </button>
                                    <button
                                      onClick={() => window.open(res.pdf, '_blank')}
                                      className="flex-1 bg-blue-900 border border-blue-900 hover:bg-blue-800 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                                    >
                                      <DownloadIcon className="w-3.5 h-3.5 mr-1.5" /> Descargar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-spawn">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Contenido de Introducción</h3>
              <button onClick={() => setIsIntroModalOpen(false)} className="bg-red-500 rounded-full p-1 text-white hover:bg-red-600">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <p className="text-xs text-gray-500 mb-4">
                Configure el contenido de introducción del módulo con nombre, descripción y URL del video
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del módulo *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={editingIntro.title}
                  onChange={(e) => setEditingIntro({ ...editingIntro, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  value={editingIntro.description}
                  onChange={(e) => setEditingIntro({ ...editingIntro, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL del video *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={editingIntro.videoUrl}
                  onChange={(e) => setEditingIntro({ ...editingIntro, videoUrl: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">Ingrese la URL completa del video de introducción</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <span className="text-blue-600 font-bold text-xs block mb-1">Configuración actual:</span>
                <div className="text-xs space-y-1">
                  <p><span className="font-bold text-blue-700">Nombre:</span> <span className="text-blue-600">{introContent.title}</span></p>
                  <p><span className="font-bold text-blue-700">Descripción:</span> <span className="text-blue-600 line-clamp-1">{introContent.description}</span></p>
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
      )
      }

      {/* --- ADD SECTION MODAL --- */}
      {
        isAddSectionModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-spawn">
              {/* Header */}
              <div className="flex justify-between items-center p-6 pb-0">
                <h2 className="text-xl font-bold text-gray-900">Crear Nueva Sección</h2>
                <button onClick={() => setIsAddSectionModalOpen(false)} className="bg-red-500 text-white rounded-sm w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors">
                  <span className="text-lg">&times;</span>
                </button>
              </div>

              <div className="px-6 pt-4">
                <p className="text-xs text-gray-500 text-left">Complete los datos para crear una nueva sección en el repositorio de contenidos</p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-[#002B6B] mb-2 text-left">Nombre de la sección *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Ingrese el nombre de la sección"
                    value={newSection.nombre}
                    onChange={(e) => setNewSection({ ...newSection, nombre: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-[#002B6B] mb-2 text-left">Descripción (opcional)</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-sm"
                    placeholder="Ingrese una descripción para la sección"
                    value={newSection.descripcion}
                    onChange={(e) => setNewSection({ ...newSection, descripcion: e.target.value })}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex gap-4">
                <button
                  onClick={() => setIsAddSectionModalOpen(false)}
                  className="flex-1 py-2 border border-blue-400 rounded-lg text-[#002B6B] hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSection}
                  className="flex-1 py-2 bg-[#002B6B] text-white rounded-lg hover:bg-blue-900 transition-colors font-medium text-sm"
                >
                  Crear Sección
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* --- ADD RESOURCE MODAL --- */}
      {
        isAddResourceModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-spawn">
              <div className="flex justify-between items-center p-6 pb-0">
                <h2 className="text-xl font-bold text-gray-900">Registrar Nuevo Recurso</h2>
                <button onClick={() => setIsAddResourceModalOpen(false)} className="bg-red-500 text-white rounded-sm w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors">
                  <span className="text-lg">&times;</span>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-blue-600 mb-1">Nombre del Archivo *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Ej: Temario Inicial 2025"
                    value={newResource.nombreArchivo}
                    onChange={(e) => setNewResource({ ...newResource, nombreArchivo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-600 mb-1">Archivo PDF *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500 text-sm outline-none"
                      placeholder="URL del archivo subido"
                      value={newResource.pdf}
                    />
                    <label className={`bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 cursor-pointer flex items-center justify-center transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <UploadIcon className="w-5 h-5" />
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => handleFileUpload(e, 'pdf')}
                      />
                    </label>
                  </div>
                  {uploading && <p className="text-xs text-blue-500 mt-1">Subiendo archivo...</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-600 mb-1">Imagen (opcional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500 text-sm outline-none"
                      placeholder="URL de la imagen subida"
                      value={newResource.imagen}
                    />
                    <label className={`bg-gray-600 hover:bg-gray-700 text-white rounded-md px-4 py-2 cursor-pointer flex items-center justify-center transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <UploadIcon className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => handleFileUpload(e, 'imagen')}
                      />
                    </label>
                  </div>
                </div>

              </div>
              <div className="p-6 pt-0 flex gap-4">
                <button
                  onClick={() => setIsAddResourceModalOpen(false)}
                  className="flex-1 py-2 border border-blue-400 rounded-lg text-blue-600 hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateResource}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-900 transition-colors font-medium text-sm"
                >
                  Guardar Recurso
                </button>
              </div>

            </div>

          </div >
        )
      }

      {/* --- ADD SUBSECTION MODAL --- */}
      {
        isAddSubsectionModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-spawn">
              <div className="flex justify-between items-center p-6 pb-0">
                <h2 className="text-xl font-bold text-gray-900">Añadir Subsección</h2>
                <button onClick={() => setIsAddSubsectionModalOpen(false)} className="bg-red-500 text-white rounded-sm w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors">
                  <span className="text-lg">&times;</span>
                </button>
              </div>
              <div className="px-6 pt-4">
                <p className="text-xs text-gray-500">Crea una nueva categoría para organizar tus recursos.</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#002B6B] mb-1">Nombre de la Subsección *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Ej: Exámenes 2024"
                    value={newSubsection.nombre}
                    onChange={(e) => setNewSubsection({ ...newSubsection, nombre: e.target.value })}
                  />
                </div>
              </div>
              <div className="p-6 pt-0 flex gap-4">
                <button
                  onClick={() => setIsAddSubsectionModalOpen(false)}
                  className="flex-1 py-2 border border-blue-400 rounded-lg text-[#002B6B] hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSubsection}
                  className="flex-1 py-2 bg-[#002B6B] text-white rounded-lg hover:bg-blue-900 transition-colors font-medium text-sm"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* --- EDIT SECTION MODAL --- */}
      {
        isEditSectionModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-spawn">
              <div className="flex justify-between items-center p-6 pb-0">
                <h2 className="text-xl font-bold text-gray-900">Editar Sección</h2>
                <button onClick={() => setIsEditSectionModalOpen(false)} className="bg-red-500 text-white rounded-sm w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors">
                  <span className="text-lg">&times;</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#002B6B] mb-2 text-left">Nombre de la sección *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    value={editingSection.nombre}
                    onChange={(e) => setEditingSection({ ...editingSection, nombre: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#002B6B] mb-2 text-left">Descripción (opcional)</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-sm"
                    value={editingSection.descripcion}
                    onChange={(e) => setEditingSection({ ...editingSection, descripcion: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-4">
                <button
                  onClick={() => setIsEditSectionModalOpen(false)}
                  className="flex-1 py-2 border border-blue-400 rounded-lg text-[#002B6B] hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateSection}
                  className="flex-1 py-2 bg-[#002B6B] text-white rounded-lg hover:bg-blue-900 transition-colors font-medium text-sm"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* --- EDIT SUBSECTION MODAL --- */}
      {
        isEditSubsectionModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-spawn">
              <div className="flex justify-between items-center p-6 pb-0">
                <h2 className="text-xl font-bold text-gray-900">Editar Subsección</h2>
                <button onClick={() => setIsEditSubsectionModalOpen(false)} className="bg-red-500 text-white rounded-sm w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors">
                  <span className="text-lg">&times;</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#002B6B] mb-1">Nombre de la Subsección *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    value={editingSubsection.nombre}
                    onChange={(e) => setEditingSubsection({ ...editingSubsection, nombre: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-4">
                <button
                  onClick={() => setIsEditSubsectionModalOpen(false)}
                  className="flex-1 py-2 border border-blue-400 rounded-lg text-[#002B6B] hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateSubsection}
                  className="flex-1 py-2 bg-[#002B6B] text-white rounded-lg hover:bg-blue-900 transition-colors font-medium text-sm"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        )
      }

    </AdminLayout >
  );
};

export default Recursos;
