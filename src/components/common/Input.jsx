import { cloneElement, isValidElement, useId } from "react";

// Campo de formulário padrão: rótulo, mensagem de erro e borda vermelha quando
// inválido. Aceita o <input> nativo ou um filho (select/textarea) — nesse caso
// o id do rótulo é repassado ao filho, senão o label não apontaria para nada.
export default function Input({
  label,
  value,
  onChange,
  onKeyDown,
  type = "text",
  placeholder = "",
  className = "",
  erro = "",
  disabled = false,
  min,
  max,
  step,
  inputMode,
  maxLength,
  children,
}) {
  const id = useId();
  const descricaoId = erro ? `${id}-erro` : undefined;
  const atributosDeErro = {
    id,
    "aria-invalid": erro ? true : undefined,
    "aria-describedby": descricaoId,
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-gray-600 mb-1">
          {label}
        </label>
      )}

      {isValidElement(children) ? (
        cloneElement(children, atributosDeErro)
      ) : (
        <input
          {...atributosDeErro}
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          inputMode={inputMode}
          maxLength={maxLength}
          className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors
            focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-400
            ${erro ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-blue-500"}`}
        />
      )}

      {erro && (
        <p id={descricaoId} className="text-xs text-red-600 mt-1">
          {erro}
        </p>
      )}
    </div>
  );
}
