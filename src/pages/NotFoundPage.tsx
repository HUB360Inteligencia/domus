
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="text-2xl font-medium text-gray-600 mb-6">Página não encontrada</p>
      <Link to="/" className="text-primary hover:underline">
        Voltar para a página inicial
      </Link>
    </div>
  );
}
