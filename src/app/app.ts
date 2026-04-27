import { Component } from '@angular/core';
import { PacienteCrudComponent } from './components/paciente-crud.component';

@Component({
  selector: 'app-root',
  imports: [PacienteCrudComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
