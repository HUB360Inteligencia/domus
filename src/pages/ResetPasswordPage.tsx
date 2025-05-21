
export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Redefinir senha</h1>
        <form className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nova senha
            </label>
            <input
              type="password"
              id="password"
              className="w-full p-2 border rounded-md"
              placeholder="********"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar senha
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="w-full p-2 border rounded-md"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Redefinir senha
          </button>
        </form>
      </div>
    </div>
  );
}
