export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  isPopular?: boolean;
}
