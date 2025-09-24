import { HelmetProvider, Helmet } from "react-helmet-async";

const APP_TITLE_PREFIX = "GISTREEVIEW";

const PageMeta = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  const normalizedTitle = title?.startsWith(`${APP_TITLE_PREFIX} |`) ? title : `${APP_TITLE_PREFIX} | ${title}`;
  return (
    <Helmet>
      <title>{normalizedTitle}</title>
      <meta name="description" content={description} />
    </Helmet>
  );
};

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>{children}</HelmetProvider>
);

export default PageMeta;
