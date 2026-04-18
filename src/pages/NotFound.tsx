import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

const NotFound = () => {
  const tr = t();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{tr.notFound.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{tr.notFound.subtitle}</p>
      <Button asChild className="mt-6">
        <Link to="/dashboard">{tr.notFound.back}</Link>
      </Button>
    </div>
  );
};

export default NotFound;
