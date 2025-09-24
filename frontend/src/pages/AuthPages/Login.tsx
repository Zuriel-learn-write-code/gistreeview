import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import LoginForm from "../../components/auth/LoginForm";
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation();
  return (
    <>
      <PageMeta
        title={t('pages.loginTitle')}
        description={t('pages.loginDescription')}
      />
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </>
  );
}
