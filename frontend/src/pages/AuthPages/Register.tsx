import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import RegisterForm from "../../components/auth/RegisterForm";
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  return (
    <>
      <PageMeta
        title={t('pages.registerTitle')}
        description={t('pages.registerDescription')}
      />
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </>
  );
}
