import React, { useState, useEffect, useCallback } from 'react';

import Link from 'next/link';

import { useAuth } from '../hooks/useAuth';
import { comentarioService, Comentario } from '../services/comentarioService';
import { userService, User } from '../services/userService';

interface CommentsSectionProps {
  noticiaId: number;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ noticiaId }) => {
  const [comments, setComments] = useState<Comentario[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [commentsData, usersData] = await Promise.all([
        comentarioService.getAll(noticiaId),
        userService.getAll(),
      ]);
      setComments(commentsData);
      setUsersList(usersData);
    } catch (err) {
      // Error loading data
    } finally {
      setLoading(false);
    }
  }, [noticiaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user || user.id === undefined) {
      return;
    }

    try {
      await comentarioService.create({
        contenido: newComment,
        noticiaId,
        usuarioId: user.id,
      });
      setNewComment('');
      fetchData();
    } catch (err) {
      // Error posting comment
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este comentario?')) return;
    try {
      await comentarioService.delete(id);
      fetchData();
    } catch (err) {
      // Error deleting comment
    }
  };

  const getAuthorName = (comment: Comentario) => {
    // Try to find user in the fetched list first (frontend mapping)
    const author = usersList.find((u) => u.id === comment.usuarioId);
    if (author) return author.nombreCompleto;

    // Fallback to existing logic
    return comment.usuario?.nombreCompleto || 'Usuario';
  };

  const showMoreComments = () => {
    setVisibleCount((prev) => prev + 5);
  };

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Comentarios</h2>

      {/* List of comments */}
      <div
        className={`space-y-6 mb-8 ${
          comments.length > 3 ? 'max-h-[500px] overflow-y-auto pr-2' : ''
        }`}
      >
        {comments.length === 0 && !loading && (
          <p className="text-gray-500 italic">
            No hay comentarios aún. ¡Sé el primero en comentar!
          </p>
        )}

        {comments.slice(0, visibleCount).map((comment) => (
          <div key={comment.id} className="bg-gray-50 rounded-lg p-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-900">
                  {getAuthorName(comment)}
                </h4>
                <span className="text-xs text-gray-500">
                  {new Date(comment.fecha).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap">
              {comment.contenido}
            </p>
          </div>
        ))}
      </div>

      {comments.length > visibleCount && (
        <button
          onClick={showMoreComments}
          className="w-full text-center text-blue-600 hover:text-blue-800 font-medium py-2 mb-6 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Ver más comentarios ({comments.length - visibleCount} restantes)
        </button>
      )}

      {/* Add comment form */}
      {user ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Deja tu comentario
          </h3>
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
            <Link
              href="/login"
              className="font-bold underline hover:text-blue-900"
            >
              iniciar sesión
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
