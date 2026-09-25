import Link from "next/link";
import { ChefHat, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности | В гостях у Лидии",
  description: "Политика в отношении обработки и защиты персональных данных пользователей сервиса шеф-повара Лидии (152-ФЗ).",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fcfcf9] text-[#2d2c2a] selection:bg-[#e8e6df] font-sans flex flex-col">
      {/* Header */}
      <header className="px-4 py-6 md:px-16 w-full mx-auto flex justify-between items-center bg-[#fcfcf9] z-50 relative border-b border-[#f1f0e9]">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity shrink-0">
          <ChefHat size={24} className="text-[#2d2c2a]" />
          <span className="font-serif italic text-xl md:text-2xl tracking-wide">В гостях у Лидии</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] font-medium text-[#8a8883] absolute left-1/2 -translate-x-1/2">
          <Link href="/" className="hover:text-[#2d2c2a] transition-colors">Каталог</Link>
          <Link href="/blog" className="hover:text-[#2d2c2a] transition-colors">Блог</Link>
          <Link href="/about" className="hover:text-[#2d2c2a] transition-colors">Обо мне</Link>
          <Link href="/cabinet" className="hover:text-[#2d2c2a] transition-colors">Кабинет</Link>
        </nav>

        <Link
          href="/"
          className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-[#8a8883] hover:text-[#2d2c2a] transition-colors"
        >
          <ArrowLeft size={16} /> На главную
        </Link>
      </header>

      {/* Content */}
      <section className="flex-1 px-6 md:px-16 py-12 md:py-20 w-full max-w-[900px] mx-auto">
        <span className="text-[10px] text-[#8a8883] uppercase tracking-[0.3em] font-bold block mb-4">
          ДОКУМЕНТЫ СЕРВИСА
        </span>
        <h1 className="text-3xl md:text-5xl font-serif italic tracking-tight mb-4 text-[#2d2c2a]">
          Политика конфиденциальности
        </h1>
        <p className="text-xs text-[#8a8883] uppercase tracking-wider mb-12">
          Политика в отношении обработки персональных данных (в соответствии с Федеральным законом № 152-ФЗ РФ)
        </p>

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-[#44423f] font-light">
          <div>
            <h2 className="text-lg font-serif italic font-normal text-[#2d2c2a] mb-3">
              1. Общие положения
            </h2>
            <p className="mb-2">
              1.1. Настоящая Политика определяет порядок сбора, хранения, обработки и защиты персональных данных физических лиц — пользователей сайта <strong>chef-lidiya.ru</strong> (далее — «Сайт»).
            </p>
            <p>
              1.2. Настоящий документ составлен в полном соответствии с требованиями Федерального закона Российской Федерации от 27.07.2006 г. № 152-ФЗ «О персональных данных» и является общедоступным.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-serif italic font-normal text-[#2d2c2a] mb-3">
              2. Цели обработки персональных данных
            </h2>
            <p className="mb-2">Оператор обрабатывает персональные данные исключительно для следующих целей:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Регистрация и аутентификация пользователя на Сайте и предоставление доступа к личному кабинету;</li>
              <li>Исполнение обязательств по договору публичной оферты (предоставление платного доступа к авторским рецептам, обучающим материалам и подписке);</li>
              <li>Направление кассовых электронных чеков во исполнение требований Федерального закона № 54-ФЗ;</li>
              <li>Осуществление клиентской и технической поддержки;</li>
              <li>Сбор аналитики для улучшения удобства пользования Сайтом.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-serif italic font-normal text-[#2d2c2a] mb-3">
              3. Состав обрабатываемых данных
            </h2>
            <p className="mb-2">
              3.1. Оператор может обрабатывать следующие персональные данные Пользователя:
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-3">
              <li>Имя (или псевдоним);</li>
              <li>Адрес электронной почты (e-mail);</li>
              <li>Номер телефона (при указании);</li>
              <li>Идентификатор Telegram (при авторизации через Telegram Mini App);</li>
              <li>Технические обезличенные данные (cookie, IP-адрес, данные об используемом браузере и устройстве).</li>
            </ul>
            <p className="bg-[#f6f5f0] p-4 rounded-xl border border-[#e2e0d8] text-xs">
              <strong>Внимание:</strong> Оператор <strong>не собирает и не хранит</strong> данные банковских карт Пользователей (номера карт, CVC/CVV-коды). Все платежи осуществляются через защищенный шлюз авторизованного оператора по переводу денежных средств (Robokassa), соответствующий международному стандарту безопасности данных индустрии платежных карт PCI DSS.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-serif italic font-normal text-[#2d2c2a] mb-3">
              4. Порядок обработки и безопасность данных
            </h2>
            <p className="mb-2">
              4.1. База данных информации, содержащей персональные данные граждан Российской Федерации, расположена на территории РФ (г. Санкт-Петербург, дата-центр сертифицированного хостинг-провайдера ООО «Таймвэб»).
            </p>
            <p className="mb-2">
              4.2. Безопасность данных обеспечивается комплексом организационных и технических мер (ст. 18.1 и 19 152-ФЗ):
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li>Использование протоколов защищенного соединения HTTPS (SSL/TLS шифрование трафика);</li>
              <li>Парольная защита и ролевое разграничение прав доступа к базам данных и серверному оборудованию;</li>
              <li>Межсетевые экраны и антивирусная защита хостинг-провайдера;</li>
              <li>Регулярное резервное копирование данных для предотвращения их утраты.</li>
            </ul>
            <p>
              4.3. Трансграничная передача персональных данных не осуществляется.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-serif italic font-normal text-[#2d2c2a] mb-3">
              5. Права субъекта персональных данных
            </h2>
            <p className="mb-2">
              5.1. Пользователь имеет право на получение информации, касающейся обработки его персональных данных, требовать их уточнения, блокирования или уничтожения.
            </p>
            <p>
              5.2. Согласие на обработку персональных данных может быть отозвано в любой момент путем направления письменного уведомления на электронный адрес: <code>support@chef-lidiya.ru</code>.
            </p>
          </div>

          <div className="pt-8 border-t border-[#e2e0d8] text-xs text-[#8a8883] space-y-1">
            <p className="font-semibold text-[#2d2c2a] uppercase tracking-wider mb-2">Оператор персональных данных:</p>
            <p>Шеф-повар Лидия</p>
            <p>Сайт: https://chef-lidiya.ru</p>
            <p>Email для связи по вопросам ПДн: support@chef-lidiya.ru</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e2e0d8] bg-[#f1f0e9] px-8 md:px-16 py-12">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[#8a8883]">
          <div className="flex items-center gap-2">
            <ChefHat size={18} className="text-[#2d2c2a]" />
            <span className="font-serif italic text-base text-[#2d2c2a]">В гостях у Лидии</span>
          </div>
          <div className="flex gap-6 uppercase tracking-wider text-[10px]">
            <Link href="/terms" className="hover:text-[#2d2c2a] transition-colors">Оферта</Link>
            <Link href="/privacy" className="text-[#2d2c2a] font-bold">Политика конфиденциальности</Link>
            <Link href="/" className="hover:text-[#2d2c2a] transition-colors">Каталог</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
