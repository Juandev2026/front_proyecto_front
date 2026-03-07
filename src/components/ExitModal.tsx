import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { LogoutIcon } from '@heroicons/react/outline';

interface ExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ExitModal = ({ isOpen, onClose, onConfirm }: ExitModalProps) => {
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

          {/* This element is to trick the browser into centering the modal contents. */}
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
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 sm:mx-0 sm:h-20 sm:w-20 mb-4 shadow-inner">
                  <LogoutIcon className="h-10 w-10 text-blue-600" aria-hidden="true" />
                </div>
                
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-[#2B3674] text-center mb-2"
                >
                  ¿Salir de AVEND ESCALA?
                </Dialog.Title>
                
                <div className="mt-2">
                  <p className="text-base text-gray-500 text-center px-4">
                    Estás seguro que quieres salir de AVENDESCALA? Y volver a la página de inicio.
                  </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3 w-full">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-2xl border border-transparent shadow-lg px-6 py-3.5 bg-blue-600 text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:scale-105 active:scale-95"
                    onClick={onConfirm}
                  >
                    Sí, salir
                  </button>
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-2xl border border-gray-200 shadow-sm px-6 py-3.5 bg-white text-base font-bold text-[#2B3674] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4790FD] transition-all"
                    onClick={onClose}
                  >
                    No, quedarme
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

export default ExitModal;
