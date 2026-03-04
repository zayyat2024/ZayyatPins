export type ExamType = 'waec' | 'neco' | 'nabteb';

export interface ExamInfo {
  id: ExamType;
  name: string;
  fullName: string;
  description: string;
  color: string;
  officialUrl: string;
  pinPrice: number;
}

export interface PinPurchaseParams {
  examType: ExamType;
  quantity: number;
  email: string;
  phone: string;
}

export interface PurchasedPin {
  pin: string;
  serial?: string;
  examType: ExamType;
}

export interface ResultCheckParams {
  examType: ExamType;
  examNumber: string;
  examYear: string;
  pin: string;
  serial: string;
}

export interface SubjectResult {
  subject: string;
  grade: string;
}

export interface CandidateInfo {
  name: string;
  examNumber: string;
  examYear: string;
  school: string;
}

export interface ResultResponse {
  success: boolean;
  candidate: CandidateInfo;
  results: SubjectResult[];
}

export interface PurchaseResponse {
  success: boolean;
  transactionId: string;
  pins: PurchasedPin[];
  totalAmount: number;
}
