
export default function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Esqueci minha senha</h1>
        <p className="text-center text-gray-600 mb-6">
          Digite seu email para receber instruções de redefinição de senha
        </p>
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full p-2 border rounded-md"
              placeholder="seu@email.com"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Enviar instruções
          </button>
        </form>
      </div>
    </div>
  );
}
