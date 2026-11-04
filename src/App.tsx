import { AnnotateScreen } from './ui/screens/Annotate';
import { CropScreen } from './ui/screens/Crop';
import { DocumentScreen } from './ui/screens/Document';
import { LibraryScreen } from './ui/screens/Library';
import { MergeScreen } from './ui/screens/Merge';
import { PageEditScreen } from './ui/screens/PageEdit';
import { ScanScreen } from './ui/screens/Scan';
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
    case 'merge':
      return <MergeScreen />;
    case 'annotate':
      return <AnnotateScreen key={id} id={id} />;
    case 'scan':
      return (
        <ScanScreen
          key={route.path}
          docId={route.params.get('doc') ?? undefined}
          mode={route.params.get('mode') === 'id' ? 'id' : 'normal'}
        />
      );
    default:
      return <LibraryScreen />;
  }
}
