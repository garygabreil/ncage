import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  FirestoreService,
  AttendanceRecord,
  Student,
} from '../../services/firestore.service';

@Component({
  selector: 'app-attendance',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css',
})
export class AttendanceComponent implements OnInit {
  private firestoreService = inject(FirestoreService);
  Math = Math;

  students = signal<Student[]>([]);
  attendanceRecords = signal<AttendanceRecord[]>([]);
  selectedDate = signal(new Date().toISOString().split('T')[0]);
  isLoading = signal(true);

  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(10);

  filteredStudents = computed(() => {
    const search = this.searchTerm().toLowerCase();
    if (!search) return this.students();
    return this.students().filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.batch.toLowerCase().includes(search)
    );
  });

  paginatedStudents = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredStudents().slice(start, end);
  });

  totalPages = computed(() =>
    Math.ceil(this.filteredStudents().length / this.itemsPerPage())
  );

  ngOnInit() {
    this.isLoading.set(true);
    this.firestoreService.getStudents().subscribe((students) => {
      this.students.set(students);
      this.isLoading.set(false);
    });

    this.firestoreService.getAttendanceRecords().subscribe((records) => {
      this.attendanceRecords.set(records);
    });
  }

  filteredRecords = computed(() => {
    const date = this.selectedDate();
    return this.attendanceRecords().filter((record) => record.date === date);
  });

  presentCount = computed(() => {
    return this.filteredRecords().filter((r) => r.status === 'present').length;
  });

  lateCount = computed(() => {
    return this.filteredRecords().filter((r) => r.status === 'late').length;
  });

  absentCount = computed(() => {
    return this.filteredRecords().filter((r) => r.status === 'absent').length;
  });

  async markAttendance(
    studentId: string,
    studentName: string,
    status: 'present' | 'absent' | 'late'
  ) {
    const date = this.selectedDate();
    const existing = this.attendanceRecords().find(
      (r) => r.studentId === studentId && r.date === date
    );

    if (existing && existing.id) {
      await this.firestoreService.updateAttendanceRecord(existing.id, {
        status,
      });
    } else {
      const newRecord: AttendanceRecord = {
        studentId,
        studentName,
        date,
        status,
      };
      await this.firestoreService.addAttendanceRecord(newRecord);
    }
  }

  getAttendanceStatus(studentId: string): 'present' | 'absent' | 'late' | null {
    const record = this.filteredRecords().find(
      (r) => r.studentId === studentId
    );
    return record ? record.status : null;
  }

  getStatusClass(status: string | null): string {
    if (!status) return 'secondary';
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'danger';
      case 'late':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onItemsPerPageChange() {
    this.currentPage.set(1);
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }
}
