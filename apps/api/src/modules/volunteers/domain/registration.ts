import { REGISTRATION_EMAIL_MAX_LENGTH } from '@joj/shared';
import { VolunteerError } from './volunteers.errors';

export interface RegistrationProps {
  id: string;
  slotId: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface NewRegistration {
  id: string;
  slotId: string;
  name: string;
  email: string;
  now: Date;
}

/** Une partie locale et un domaine avec un point, sans espace : le format suffit, pas de vérification d'existence. */
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Un bénévole inscrit sur un créneau : un nom non vide et un email bien formé. */
export class Registration {
  private constructor(private readonly props: RegistrationProps) {}

  /** Appelée par `Slot.register()`, qui vérifie la capacité du créneau. */
  static create({ id, slotId, name, email, now }: NewRegistration): Registration {
    return new Registration({
      id,
      slotId,
      name: validName(name),
      email: validEmail(email),
      createdAt: now,
    });
  }

  /** Reconstruit une inscription depuis la persistance, sans rejouer les règles de création. */
  static restore(props: RegistrationProps): Registration {
    return new Registration({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get slotId(): string {
    return this.props.slotId;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

function validName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new VolunteerError('REGISTRATION_NAME_REQUIRED', 'A volunteer needs a name');
  }
  return trimmed;
}

function validEmail(email: string): string {
  if (email.length > REGISTRATION_EMAIL_MAX_LENGTH || !EMAIL_FORMAT.test(email)) {
    throw new VolunteerError('REGISTRATION_EMAIL_INVALID', `Malformed email ${email}`, { email });
  }
  return email;
}
