import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  FirestoreService,
  Booking,
  Student,
  Invoice,
} from '../../services/firestore.service';

@Component({
  selector: 'app-billing',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.css',
})
export class BillingComponent implements OnInit {
  private firestoreService = inject(FirestoreService);

  students = signal<Student[]>([]);
  bookings = signal<Booking[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  // Pagination and search
  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(10);
  Math = Math;

  filteredBookings = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.bookings();
    return this.bookings().filter(
      (booking) =>
        booking.studentName.toLowerCase().includes(term) ||
        booking.date.includes(term) ||
        booking.status.toLowerCase().includes(term)
    );
  });

  paginatedBookings = computed(() => {
    const filtered = this.filteredBookings();
    const perPage = this.itemsPerPage();
    const page = this.currentPage();
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredBookings().length / this.itemsPerPage());
  });

  customerNameInput = signal('');
  showSuggestions = signal(false);
  filteredStudents = computed(() => {
    const input = this.customerNameInput().toLowerCase();
    if (!input || input.length < 1) return [];
    return this.students()
      .filter((s) => s.name.toLowerCase().includes(input))
      .slice(0, 5);
  });

  ngOnInit() {
    this.isLoading.set(true);
    this.firestoreService.getStudents().subscribe((students) => {
      this.students.set(students);
    });

    this.firestoreService.getBookings().subscribe((bookings) => {
      this.bookings.set(bookings);
      this.isLoading.set(false);
    });
  }

  currentBooking = signal<Partial<Booking>>({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    ratePerHour: 50,
    status: 'pending',
  });

  showModal = signal(false);
  isEditing = signal(false);

  // Helper methods for updating booking fields
  updateCustomerName(value: string) {
    this.customerNameInput.set(value);
    this.showSuggestions.set(value.length > 0);
  }

  selectStudent(student: Student) {
    this.customerNameInput.set(student.name);
    this.currentBooking.set({
      ...this.currentBooking(),
      studentId: student.id,
    });
    this.showSuggestions.set(false);
  }

  updateStudentId(value: string) {
    this.currentBooking.set({ ...this.currentBooking(), studentId: value });
  }

  updateDate(value: string) {
    this.currentBooking.set({ ...this.currentBooking(), date: value });
  }

  updateRatePerHour(value: number) {
    this.currentBooking.set({ ...this.currentBooking(), ratePerHour: value });
  }

  updateStartTime(value: string) {
    this.currentBooking.set({ ...this.currentBooking(), startTime: value });
  }

  updateEndTime(value: string) {
    this.currentBooking.set({ ...this.currentBooking(), endTime: value });
  }

  calculatedHours = computed(() => {
    const booking = this.currentBooking();
    if (booking.startTime && booking.endTime) {
      const start = new Date(`2000-01-01T${booking.startTime}`);
      const end = new Date(`2000-01-01T${booking.endTime}`);
      const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return diff > 0 ? Math.round(diff * 100) / 100 : 0;
    }
    return 0;
  });

  calculatedTotal = computed(() => {
    const hours = this.calculatedHours();
    const rate = this.currentBooking().ratePerHour || 0;
    return hours * rate;
  });

  openAddModal() {
    this.isEditing.set(false);
    this.customerNameInput.set('');
    this.showSuggestions.set(false);
    this.currentBooking.set({
      studentId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      ratePerHour: 50,
      status: 'pending',
    });
    this.showModal.set(true);
  }

  openEditModal(booking: Booking) {
    this.isEditing.set(true);
    const student = this.students().find((s) => s.id === booking.studentId);
    this.customerNameInput.set(student?.name || '');
    this.showSuggestions.set(false);
    this.currentBooking.set({ ...booking });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async saveBooking() {
    const booking = this.currentBooking();
    const customerName = this.customerNameInput().trim();

    if (!customerName) return;

    const hours = this.calculatedHours();
    const totalAmount = this.calculatedTotal();

    // Find if customer name matches an existing student
    const student = this.students().find(
      (s) => s.name.toLowerCase() === customerName.toLowerCase()
    );

    const completeBooking: Booking = {
      studentId: student?.id || '',
      studentName: customerName,
      date: booking.date!,
      startTime: booking.startTime!,
      endTime: booking.endTime!,
      hours,
      ratePerHour: booking.ratePerHour!,
      totalAmount,
      status: booking.status as 'pending' | 'paid' | 'cancelled',
    };

    if (this.isEditing() && booking.id) {
      await this.firestoreService.updateBooking(booking.id, completeBooking);
    } else {
      await this.firestoreService.addBooking(completeBooking);
    }

    this.closeModal();
  }

  async updateStatus(id: string, status: 'pending' | 'paid' | 'cancelled') {
    const booking = this.bookings().find((b) => b.id === id);
    await this.firestoreService.updateBooking(id, { status });

    // Generate invoice if status is marked as paid
    if (status === 'paid' && booking) {
      await this.generateInvoice(booking);
    }
  }

  async generateInvoice(booking: Booking) {
    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = {
      invoiceNumber,
      studentName: booking.studentName,
      date: new Date().toISOString().split('T')[0],
      amount: booking.totalAmount,
      status: 'paid' as const,
      items: [
        {
          description: `Turf booking on ${booking.date} (${booking.startTime} - ${booking.endTime})`,
          hours: booking.hours,
          rate: booking.ratePerHour,
        },
      ],
    };
    await this.firestoreService.addInvoice(invoice);
    alert(`Invoice ${invoiceNumber} generated successfully!`);
  }

  async deleteBooking(id: string) {
    if (confirm('Are you sure you want to delete this booking?')) {
      await this.firestoreService.deleteBooking(id);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getTotalRevenue(): string {
    const total = this.bookings()
      .filter((b) => b.status === 'paid')
      .reduce((sum, b) => sum + b.totalAmount, 0);
    return total.toFixed(2);
  }

  getPendingAmount(): string {
    const total = this.bookings()
      .filter((b) => b.status === 'pending')
      .reduce((sum, b) => sum + b.totalAmount, 0);
    return total.toFixed(2);
  }

  getTotalHours(): string {
    const total = this.bookings().reduce((sum, b) => sum + b.hours, 0);
    return total.toFixed(2);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onItemsPerPageChange() {
    this.currentPage.set(1);
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }
}
