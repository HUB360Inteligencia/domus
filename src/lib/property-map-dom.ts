import { formatCurrency } from '@/lib/utils';

export interface PropertyPopupData {
  id: string;
  title: string;
  address: string;
  city: string;
  value: number;
  status: string;
  type?: string;
  imageUrl?: string;
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponível',
  rented: 'Alugado',
  airbnb: 'Airbnb',
  maintenance: 'Em manutenção',
  sold: 'Vendido',
};

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  commercial: 'Comercial',
  land: 'Terreno',
  rural: 'Rural',
};

function createTextElement(tag: keyof HTMLElementTagNameMap, className: string, text: string) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

export function createPropertyPopupContent(
  property: PropertyPopupData,
  onSelect?: (id: string) => void,
) {
  const container = document.createElement('div');
  container.className = 'min-w-[210px] space-y-2 p-2';

  if (property.imageUrl) {
    const image = document.createElement('img');
    image.src = property.imageUrl;
    image.alt = property.title;
    image.loading = 'lazy';
    image.className = 'h-24 w-full rounded object-cover';
    container.appendChild(image);
  }

  container.appendChild(createTextElement('h3', 'text-sm font-semibold', property.title));
  container.appendChild(
    createTextElement('p', 'text-xs text-gray-600', [property.address, property.city].filter(Boolean).join(', ')),
  );

  const badges = document.createElement('div');
  badges.className = 'flex items-center justify-between gap-2 text-xs';
  if (property.type) {
    badges.appendChild(
      createTextElement(
        'span',
        'rounded border border-gray-200 bg-gray-50 px-2 py-1 font-medium text-gray-700',
        TYPE_LABELS[property.type] || property.type,
      ),
    );
  }
  badges.appendChild(
    createTextElement(
      'span',
      'rounded bg-gray-700 px-2 py-1 text-white',
      STATUS_LABELS[property.status] || property.status,
    ),
  );
  container.appendChild(badges);
  container.appendChild(createTextElement('p', 'text-sm font-semibold', formatCurrency(property.value)));

  if (onSelect) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'w-full rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700';
    button.textContent = 'Ver detalhes';
    button.addEventListener('click', () => onSelect(property.id));
    container.appendChild(button);
  }

  return container;
}
