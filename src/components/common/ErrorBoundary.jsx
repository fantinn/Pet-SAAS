import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main role="alert" className="p-8 space-y-4">
      <h1 className="text-xl font-semibold">Não foi possível abrir esta tela</h1>
      <p>Recarregue a página. Se o problema continuar, entre em contato com o suporte.</p>
      <button className="border rounded p-3" onClick={() => window.location.reload()}>Recarregar</button>
    </main>;
    return this.props.children;
  }
}
