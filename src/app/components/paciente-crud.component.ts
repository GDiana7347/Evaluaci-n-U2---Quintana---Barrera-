import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { startWith } from 'rxjs';
import { Paciente } from '../models/paciente.model';
import { PacienteService } from '../services/paciente.service';

function fechaNoFuturaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const fechaIngresada = new Date(control.value);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return fechaIngresada > hoy ? { fechaFutura: true } : null;
}

@Component({
  selector: 'app-paciente-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './paciente-crud.component.html'
})
export class PacienteCrudComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly pacienteService = inject(PacienteService);

  readonly idEdicion = signal<string | null>(null);
  readonly mensajeError = signal('');
  readonly envioIntentado = signal(false);

  readonly pacientes = this.pacienteService.pacientes;
  readonly totalPacientes = this.pacienteService.totalPacientes;
  readonly cupoDisponible = this.pacienteService.cupoDisponible;
  readonly estaLleno = this.pacienteService.estaLleno;
  readonly enModoEdicion = computed(() => this.idEdicion() !== null);

  readonly pacienteForm = this.fb.nonNullable.group({
    id: ['', [Validators.required, Validators.minLength(1)]],
    nombreCompleto: ['', [Validators.required, Validators.minLength(4)]],
    fechaNacimiento: ['', [Validators.required, fechaNoFuturaValidator]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
    direccion: ['', [Validators.required, Validators.minLength(8)]],
    tipoSeguro: ['', [Validators.required, Validators.minLength(3)]],
    motivoConsulta: ['', [Validators.required, Validators.minLength(5)]]
  });

  private readonly estadoFormulario = toSignal(
    this.pacienteForm.statusChanges.pipe(startWith(this.pacienteForm.status)),
    { initialValue: this.pacienteForm.status }
  );

  readonly formularioValido = computed(() => this.estadoFormulario() === 'VALID');

  onSubmit(): void {
    this.envioIntentado.set(true);
    this.mensajeError.set('');

    if (!this.formularioValido()) {
      return;
    }

    const paciente = this.pacienteForm.getRawValue() as Paciente;

    if (this.enModoEdicion()) {
      const actualizado = this.pacienteService.actualizarPaciente(paciente);
      if (!actualizado) {
        this.mensajeError.set('No se pudo actualizar el paciente.');
        return;
      }
      this.cancelarEdicion();
      return;
    }

    const agregado = this.pacienteService.agregarPaciente(paciente);
    if (!agregado) {
      this.mensajeError.set(
        this.estaLleno()
          ? 'Aforo completo: solo se permiten 10 pacientes.'
          : 'El ID ya existe. Usa un ID diferente.'
      );
      return;
    }

    this.resetFormulario();
  }

  editarPaciente(paciente: Paciente): void {
    this.idEdicion.set(paciente.id);
    this.mensajeError.set('');
    this.envioIntentado.set(false);
    this.pacienteForm.patchValue(paciente);
    // El ID no debe cambiar durante la edición.
    this.pacienteForm.controls.id.disable();
  }

  eliminarPaciente(id: string): void {
    if (this.idEdicion() === id) {
      this.cancelarEdicion();
    }
    this.pacienteService.eliminarPaciente(id);
  }

  cancelarEdicion(): void {
    this.idEdicion.set(null);
    this.resetFormulario();
  }

  mostrarError(campo: keyof Paciente): boolean {
    const control = this.pacienteForm.controls[campo];
    return control.invalid && (control.touched || this.envioIntentado());
  }

  calcularEdad(fechaNacimiento: string): number {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mesActual = hoy.getMonth();
    const diaActual = hoy.getDate();
    const mesNacimiento = nacimiento.getMonth();
    const diaNacimiento = nacimiento.getDate();

    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
      edad--;
    }

    return edad >= 0 ? edad : 0;
  }

  private resetFormulario(): void {
    this.pacienteForm.reset();
    this.pacienteForm.controls.id.enable();
    this.pacienteForm.markAsPristine();
    this.pacienteForm.markAsUntouched();
    this.envioIntentado.set(false);
    this.mensajeError.set('');
  }
}
