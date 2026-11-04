import { CropScreen } from './ui/screens/Crop';
import { DocumentScreen } from './ui/screens/Document';
import { LibraryScreen } from './ui/screens/Library';
import { PageEditScreen } from './ui/screens/PageEdit';
import { ToastProvider } from './ui/components/Toast';
import { useRoute } from './ui/router';

export function App() {
  return <ToastProvider>{screenFor(useRoute())}</ToastProvider>;
}

function screenFor(route: ReturnType<typeof useRoute>) {
  const [section, id] = route.segments;
  switch (section) {
    case 'doc':
      return <DocumentScreen key={id} id={id} />;
    case 'page':
      return <PageEditScreen key={id} id={id} />;
    case 'crop':
      return <CropScreen key={id} id={id} />;
    default:
      return <LibraryScreen />;
  }
}
