import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
  CollectionReference,
  DocumentData,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Student {
  id?: string;
  name: string;
  address: string;
  phone: string;
  batch: string;
  registrationDate: string;
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

export interface Booking {
  id?: string;
  studentId: string;
  studentName: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  ratePerHour: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
}

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  studentName: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  items: { description: string; hours: number; rate: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private firestore: Firestore;

  constructor() {
    const app = initializeApp(environment.firebase);
    this.firestore = getFirestore(app);
  }

  // Helper method to create Observable from Firestore snapshot
  private createObservable<T>(collectionName: string): Observable<T[]> {
    return new Observable((observer) => {
      const col = collection(this.firestore, collectionName);
      const unsubscribe = onSnapshot(
        col,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          observer.next(data);
        },
        (error) => {
          observer.error(error);
        }
      );
      return () => unsubscribe();
    });
  }

  // Students
  getStudents(): Observable<Student[]> {
    return this.createObservable<Student>('students');
  }

  async addStudent(student: Student): Promise<void> {
    const studentsCol = collection(this.firestore, 'students');
    await addDoc(studentsCol, student);
  }

  async updateStudent(id: string, student: Partial<Student>): Promise<void> {
    const studentDoc = doc(this.firestore, 'students', id);
    await updateDoc(studentDoc, student as DocumentData);
  }

  async deleteStudent(id: string): Promise<void> {
    const studentDoc = doc(this.firestore, 'students', id);
    await deleteDoc(studentDoc);
  }

  // Attendance
  getAttendanceRecords(): Observable<AttendanceRecord[]> {
    return this.createObservable<AttendanceRecord>('attendance');
  }

  async addAttendanceRecord(record: AttendanceRecord): Promise<void> {
    const attendanceCol = collection(this.firestore, 'attendance');
    await addDoc(attendanceCol, record);
  }

  async updateAttendanceRecord(
    id: string,
    record: Partial<AttendanceRecord>
  ): Promise<void> {
    const recordDoc = doc(this.firestore, 'attendance', id);
    await updateDoc(recordDoc, record as DocumentData);
  }

  // Bookings
  getBookings(): Observable<Booking[]> {
    return this.createObservable<Booking>('bookings');
  }

  async addBooking(booking: Booking): Promise<void> {
    const bookingsCol = collection(this.firestore, 'bookings');
    await addDoc(bookingsCol, booking);
  }

  async updateBooking(id: string, booking: Partial<Booking>): Promise<void> {
    const bookingDoc = doc(this.firestore, 'bookings', id);
    await updateDoc(bookingDoc, booking as DocumentData);
  }

  async deleteBooking(id: string): Promise<void> {
    const bookingDoc = doc(this.firestore, 'bookings', id);
    await deleteDoc(bookingDoc);
  }

  // Invoices
  getInvoices(): Observable<Invoice[]> {
    return this.createObservable<Invoice>('invoices');
  }

  async addInvoice(invoice: Invoice): Promise<void> {
    const invoicesCol = collection(this.firestore, 'invoices');
    await addDoc(invoicesCol, invoice);
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<void> {
    const invoiceDoc = doc(this.firestore, 'invoices', id);
    await updateDoc(invoiceDoc, invoice as DocumentData);
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoiceDoc = doc(this.firestore, 'invoices', id);
    await deleteDoc(invoiceDoc);
  }
}
