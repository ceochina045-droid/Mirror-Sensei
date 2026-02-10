
export interface User {
  id: string;
  fullName: string;
  userName: string;
  passcode: string;
  profilePic?: string;
}

export interface Student {
  id: string;
  name: string;
  age: number;
  startingDate: string;
  address: string;
  contactNumber?: string;
  profilePic: string;
  feeAmount: number;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  month: string;
  amount: number;
  date: string;
  status: 'Paid';
}

export type ViewType = 'home' | 'students' | 'payment' | 'history' | 'profile';
