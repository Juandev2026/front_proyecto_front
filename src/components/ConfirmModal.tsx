import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/outline';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'success' | 'warning';
}

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
}: ConfirmModalProps) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <ExclamationIcon className="h-10 w-10 text-red-600" aria-hidden="true" />;
      case 'success':
        return <CheckCircleIcon className="h-10 w-10 text-green-600" aria-hidden="true" />;
      default:
        return <InformationCircleIcon className="h-10 w-10 text-blue-600" aria-hidden="true" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-100';
      case 'success':
        return 'bg-green-100';
      default:
        return 'bg-blue-100';
    }
  };

  const getConfirmBtnClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      default:
        return 'bg-[#002B6B] hover:bg-blue-900 focus:ring-blue-500';
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-[100] overflow-y-auto"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" />
          </Transition.Child>

          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl border border-gray-100">
              <div className="flex flex-col items-center">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full ${getIconBg()} sm:mx-0 sm:h-20 sm:w-20 mb-4 shadow-inner`}>
                  {getIcon()}
                </div>
                
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-[#2B3674] text-center mb-2"
                >
                  {title}
                </Dialog.Title>
                
                <div className="mt-2">
                  <p className="text-base text-gray-500 text-center px-4">
                    {message}
                  </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3 w-full">
                  <button
                    type="button"
                    className={`w-full inline-flex justify-center rounded-2xl border border-transparent shadow-lg px-6 py-3.5 text-base font-bold text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getConfirmBtnClass()}`}
                    onClick={onConfirm}
                  >
                    {confirmText}
                  </button>
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-2xl border border-gray-200 shadow-sm px-6 py-3.5 bg-white text-base font-bold text-[#2B3674] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4790FD] transition-all"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ConfirmModal;
