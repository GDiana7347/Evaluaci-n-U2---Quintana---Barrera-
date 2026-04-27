import { computed, Injectable, signal } from '@angular/core';
import { Paciente } from '../models/paciente.model';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private readonly aforoMaximo = 10;
  private readonly pacientesState = signal<Paciente[]>([]);

  readonly pacientes = this.pacientesState.asReadonly();
  readonly totalPacientes = computed(() => this.pacientes().length);
  readonly cupoDisponible = computed(() => this.aforoMaximo - this.totalPacientes());
  readonly estaLleno = computed(() => this.totalPacientes() >= this.aforoMaximo);

  agregarPaciente(paciente: Paciente): boolean {
    if (this.estaLleno()) {
      return false;
    }

    const existeId = this.pacientes().some((item) => item.id === paciente.id);
    if (existeId) {
      return false;
    }

    this.pacientesState.update((actual) => [...actual, paciente]);
    return true;
  }

  actualizarPaciente(pacienteActualizado: Paciente): boolean {
    const existePaciente = this.pacientes().some((item) => item.id === pacienteActualizado.id);
    if (!existePaciente) {
      return false;
    }

    this.pacientesState.update((actual) =>
      actual.map((item) => (item.id === pacienteActualizado.id ? pacienteActualizado : item))
    );
    return true;
  }

  eliminarPaciente(id: string): void {
    this.pacientesState.update((actual) => actual.filter((item) => item.id !== id));
  }
}
