import React from 'react';

const ChannelsFooter = () => {
  const channels = [
    {
      name: 'WhatsApp',
      icon: 'assets/images/whatsapp.png', // Placeholder, using text/svg if image missing
      color: 'bg-green-500',
      textColor: 'text-white',
      link: '#',
      svg: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
    },
    {
      name: 'Telegram',
      icon: 'assets/images/telegram.png',
      color: 'bg-blue-500',
      textColor: 'text-white',
      link: '#',
      svg: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.638z" />
        </svg>
      ),
    },
    {
      name: 'Messenger',
      icon: 'assets/images/messenger.png',
      color: 'bg-blue-600',
      textColor: 'text-white',
      link: '#',
      svg: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.245c1.09.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.108S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.259 5.889-3.259-6.56 6.963z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white py-12 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-extrabold text-gray-900 uppercase mb-8 border-b-2 border-primary inline-block">
          ÚNETE A NUESTROS CANALES
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {channels.map((channel) => (
            <a
              key={channel.name}
              href={channel.link}
              className={`flex items-center justify-center p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group ${channel.color} hover:opacity-90`}
            >
              <div className="mr-3 text-white">{channel.svg}</div>
              <div className="text-left">
                <div className={`font-bold text-lg ${channel.textColor}`}>
                  Logo de
                </div>
                <div className={`font-extrabold text-xl ${channel.textColor}`}>
                  {channel.name}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChannelsFooter;
