import { useEffect } from 'react';
import { DocumentScreen } from './ui/screens/Document';
import { LibraryScreen } from './ui/screens/Library';
import { ToastProvider } from './ui/components/Toast';
import { useRoute } from './ui/router';

export function App() {
  const route = useRoute();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.path]);

  return <ToastProvider>{screenFor(route)}</ToastProvider>;
}

function screenFor(route: ReturnType<typeof useRoute>) {
  const [section, id] = route.segments;
  switch (section) {
    case 'doc':
      return <DocumentScreen key={id} id={id} />;
    default:
      return <LibraryScreen />;
  }
}
