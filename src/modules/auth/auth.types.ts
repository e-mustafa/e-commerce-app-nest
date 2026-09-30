import { TTokens } from '@/providers/security';

export type TLoginSuccess = TTokens & {
	requiresReactivation?: false;
};

export type TLoginReactivationRequired = {
	requiresReactivation: true;
	reactivationToken: string;
};

export type TLoginResult = TLoginSuccess | TLoginReactivationRequired;
