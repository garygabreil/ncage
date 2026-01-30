import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FirestoreService, Student } from '../../services/firestore.service';

@Component({
  selector: 'app-students',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './students.component.html',
  styleUrl: './students.component.css',
})
export class StudentsComponent implements OnInit {
  private firestoreService = inject(FirestoreService);
  Math = Math; // For template use

  students = signal<Student[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  loadingProgress = signal(0);

  // Pagination and search
  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(10);

  filteredStudents = computed(() => {
    const search = this.searchTerm().toLowerCase();
    if (!search) return this.students();
    return this.students().filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.address.toLowerCase().includes(search) ||
        s.phone.includes(search) ||
        s.batch.toLowerCase().includes(search),
    );
  });

  paginatedStudents = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredStudents().slice(start, end);
  });

  totalPages = computed(() =>
    Math.ceil(this.filteredStudents().length / this.itemsPerPage()),
  );

  currentStudent = signal<Partial<Student>>({
    name: '',
    address: '',
    phone: '',
    age: 0,
    batch: 'Dev 4to5pm below 6 yrs',
    registrationDate: new Date().toISOString().split('T')[0],
  });

  batches = [
    'Dev 4to5pm below 6 yrs',
    'Dev 5to6pm below 8 yrs',
    'Dev 6to7pm below 10 yrs',
    'Dev 7to8pm Above 12 yrs',
    'Beginner 4to5pm below 6 yrs',
    'Beginner 5to6pm below 8 yrs',
    'Beginner 6to7pm below 10 yrs',
    'Beginner 7to8pm Above 12 yrs',
  ];

  isEditing = signal(false);
  showModal = signal(false);

  // Helper methods for updating student fields
  updateName(value: string) {
    this.currentStudent.set({ ...this.currentStudent(), name: value });
  }

  updateAddress(value: string) {
    this.currentStudent.set({ ...this.currentStudent(), address: value });
  }

  updatePhone(value: string) {
    this.currentStudent.set({ ...this.currentStudent(), phone: value });
  }

  updateAge(value: number) {
    this.currentStudent.set({ ...this.currentStudent(), age: value });
  }

  updateBatch(value: string) {
    this.currentStudent.set({ ...this.currentStudent(), batch: value });
  }

  updateRegistrationDate(value: string) {
    this.currentStudent.set({
      ...this.currentStudent(),
      registrationDate: value,
    });
  }

  ngOnInit() {
    this.isLoading.set(true);

    this.firestoreService.getStudents().subscribe((students) => {
      this.students.set(students);
      this.isLoading.set(false);
      this.loadingProgress.set(100);
    });
  }
  openAddModal() {
    this.isEditing.set(false);
    this.currentStudent.set({
      name: '',
      address: '',
      phone: '',
      age: 0,
      batch: 'Dev 4to5pm below 6 yrs',
      registrationDate: new Date().toISOString().split('T')[0],
    });
    this.showModal.set(true);
  }

  openEditModal(student: Student) {
    this.isEditing.set(true);
    this.currentStudent.set({ ...student });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async saveStudent() {
    this.isSaving.set(true);
    const student = this.currentStudent();

    try {
      if (this.isEditing() && student.id) {
        await this.firestoreService.updateStudent(student.id, student);
      } else {
        await this.firestoreService.addStudent(student as Student);
      }

      // Close modal after successful save
      this.closeModal();
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Failed to save student. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteStudent(id: string) {
    if (confirm('Are you sure you want to delete this student?')) {
      await this.firestoreService.deleteStudent(id);
    }
  }

  getMonthlyRegistrations(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return this.students().filter((student) => {
      const regDate = new Date(student.registrationDate);
      return (
        regDate.getMonth() === currentMonth &&
        regDate.getFullYear() === currentYear
      );
    }).length;
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
