import Link from "next/link";
import { ChefHat, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Публичная оферта | В гостях у Лидии",
  description: "Договор публичной оферты на оказание информационных услуг и предоставление доступа к цифровому контенту шеф-повара Лидии.",
};

export default function TermsPage() {
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
          Публичная оферта
        </h1>
        <p className="text-xs text-[#8a8883] uppercase tracking-wider mb-12">
          Договор на оказание информационных услуг и предоставление доступа к цифровому контенту • Редакция от 2026 г.
        </p>

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-[#44423f] font-light">
          <div>
            <h2 className="text-lg font-serif italic font-normal text-[#2d2c2a] mb-3">
              1. Общие положения
            </h2>
            <p className="mb-2">
              1.1. Настоящий документ является официальным предложением (публичной офертой в соответствии со ст. 437 Гражданского кодекса Российской Федерации) Исполнителя заключить договор на оказание информационных услуг и предоставление доступа к цифровому контенту на сайте <strong>chef-lidiya.ru</strong> (далее — «Сайт»).
            </p>
            <p>
              1.2. Акцептом (полным и безоговорочным принятием условий настоящей оферты) является совершение Пользователем оплаты выбранного цифрового продукта или подписки на Сайте.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-serif italic font-normal text-[#2d2c2a] mb-3">
              2. Термины и определения
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Исполнитель</strong> — автор и правообладатель материалов сервиса, шеф-повар Лидия.</li>
              <li><strong>Пользователь</strong> — любое физическое лицо, осуществившее акцепт оферты.</li>
              <li><strong>Контент</strong> — электронные рецепты, технологические карты, инструкции, видео- и фотоматериалы, статьи, размещенные на Сайте.</li>
              <li><strong>Подписка</strong> — предоставление Пользователю доступа к закрытой базе материалов и обновлениям на регулярной основе (по рекуррентной модели).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-serif italic font-normal text-[#2d2c2a] mb-3">
              3. Предмет договора
            </h2>
            <p className="mb-2">
              3.1. Исполнитель обязуется предоставить Пользователю доступ к оплаченному цифровому контенту (разовое приобретение рецепта/курса) либо периодический доступ к каталогу материалов по модели подписки, а Пользователь обязуется оплатить данный доступ.
            </p>
            <p>
              3.2. Доступ к контенту предоставляется в электронном виде через личный кабинет Пользователя на Сайте или Telegram-приложение непосредственно после подтверждения оплаты.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-serif italic font-normal text-[#2d2c2a] mb-3">
              4. Стоимость и порядок расчетов
            </h2>
            <p className="mb-2">
              4.1. Стоимость материалов и тарифов подписки указывается на страницах Сайта в рублях РФ. НДС не облагается в связи с применением специального налогового режима.
            </p>
            <p className="mb-2">
              4.2. Оплата производится банковскими картами и иными доступными способами через уполномоченную платежную систему (Robokassa). Исполнитель не осуществляет сбор и хранение данных банковских карт.
            </p>
            <p className="mb-2">
              4.3. <strong>Условия подписки (рекуррентные платежи):</strong> При оформлении подписки Пользователь дает согласие на автоматическое периодическое списание денежных средств (автоплатеж) в соответствии с выбранным тарифом (например, раз в месяц) до момента отмены подписки.
            </p>
            <p>
              4.4. Пользователь вправе в любой момент отменить автоматическое продление подписки в своем личном кабинете на Сайте либо обратившись в службу поддержки. При этом доступ к материалам сохраняется до конца текущего оплаченного периода.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-serif italic font-normal text-[#2d2c2a] mb-3">
              5. Интеллектуальная собственность
            </h2>
            <p className="mb-2">
              5.1. Все материалы, рецепты, технологические описания, тексты и изображения являются объектами интеллектуальной собственности Исполнителя и защищены законодательством РФ об авторском праве.
            </p>
            <p>
              5.2. Доступ к материалам предоставляется исключительно для личного некоммерческого использования Пользователем. Запрещается копирование, передача третьим лицам, перепродажа, публикация в открытом доступе или в складчинах.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-serif italic font-normal text-[#2d2c2a] mb-3">
              6. Условия возврата денежных средств
            </h2>
            <p className="mb-2">
              6.1. В соответствии со ст. 1259 ГК РФ и нормами Закона РФ «О защите прав потребителей», электронный контент надлежащего качества, доступ к которому предоставлен в полном объеме после совершения оплаты, возврату и обмену не подлежит.
            </p>
            <p>
              6.2. В случае возникновения технического сбоя, препятствующего доступу к оплаченным материалам, Пользователь вправе обратиться к Исполнителю для оперативного устранения неисправности.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-serif italic font-normal text-[#2d2c2a] mb-3">
              7. Срок действия и изменение оферты
            </h2>
            <p className="mb-2">
              7.1. Оферта вступает в силу с момента размещения на Сайте и действует бессрочно до момента ее отзыва Исполнителем.
            </p>
            <p>
              7.2. Исполнитель оставляет за собой право вносить изменения в оферту. Актуальная редакция всегда публикуется по адресу: <code>https://chef-lidiya.ru/terms</code>.
            </p>
          </div>

          <div className="pt-8 border-t border-[#e2e0d8] text-xs text-[#8a8883] space-y-1">
            <p className="font-semibold text-[#2d2c2a] uppercase tracking-wider mb-2">Реквизиты и контакты:</p>
            <p>Исполнитель: Шеф-повар Лидия</p>
            <p>Сайт: https://chef-lidiya.ru</p>
            <p>Электронная почта для обращений: support@chef-lidiya.ru</p>
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
            <Link href="/terms" className="text-[#2d2c2a] font-bold">Оферта</Link>
            <Link href="/privacy" className="hover:text-[#2d2c2a] transition-colors">Политика конфиденциальности</Link>
            <Link href="/" className="hover:text-[#2d2c2a] transition-colors">Каталог</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
