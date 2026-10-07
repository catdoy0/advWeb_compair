export interface ChangeEmailRequest {
  email: string
  currentPassword: string
}


export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
