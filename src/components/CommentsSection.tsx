import React, { useState, useEffect, useCallback } from 'react';
import { comentarioService, Comentario } from '../services/comentarioService';
import { useAuth } from '../hooks/useAuth';

interface CommentsSectionProps {
  noticiaId: number;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ noticiaId }) => {
  const [comments, setComments] = useState<Comentario[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await comentarioService.getAll(noticiaId);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [noticiaId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user || user.id === undefined) {
        alert('Debes iniciar sesión para comentar.');
        return;
    }

    try {
      await comentarioService.create({
        contenido: newComment,
        noticiaId,
        usuarioId: user.id
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error(err);
      alert('Error al publicar el comentario.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este comentario?')) return;
    try {
      await comentarioService.delete(id);
      fetchComments();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el comentario.');
    }
  };

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Comentarios</h2>

      {/* List of comments */}
      <div className="space-y-6 mb-8">
        {comments.length === 0 && !loading && (
          <p className="text-gray-500 italic">No hay comentarios aún. ¡Sé el primero en comentar!</p>
        )}
        
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 rounded-lg p-6 relative">
             <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-gray-900">
                        {comment.usuario?.nombreCompleto || 'Usuario'}
                    </h4>
                    <span className="text-xs text-gray-500">
                        {new Date(comment.fecha).toLocaleString()}
                    </span>
                 </div>
                <button 
                    onClick={() => handleDelete(comment.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
             </div>
             <p className="mt-2 text-gray-700 whitespace-pre-wrap">{comment.contenido}</p>
          </div>
        ))}
      </div>

      {/* Add comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Deja tu comentario</h3>
          <div className="mb-4">
            <textarea
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary p-3 border"
              rows={4}
              placeholder="Escribe tu comentario aquí..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Publicar Comentario
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-blue-50 rounded-lg p-6 text-center text-blue-800">
          <p>
            Para dejar un comentario, necesitas{' '}
            <a href="/login" className="font-bold underline hover:text-blue-900">
              iniciar sesión
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
