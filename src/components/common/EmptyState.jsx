// Estado vazio padrão das listas.
export default function EmptyState({ icon: Icon, titulo, descricao }) {
  return (
    <div className="text-center py-10 px-4 bg-gray-50 border border-dashed rounded-lg">
      {Icon && <Icon className="mx-auto mb-2 text-gray-300" size={32} />}
      <p className="text-sm font-medium text-gray-600">{titulo}</p>
      {descricao && <p className="text-xs text-gray-400 mt-1">{descricao}</p>}
    </div>
  );
}
