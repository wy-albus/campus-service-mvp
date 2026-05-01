import { useMemo, useState } from 'react';
import { Layout } from './components/Layout';
import { About } from './pages/About';
import { Changelog } from './pages/Changelog';
import { Gallery } from './pages/Gallery';
import { Home } from './pages/Home';
import { Resources } from './pages/Resources';
import { Forum } from './pages/Forum';

export type PageId = 'home' | 'resources' | 'gallery' | 'forum' | 'changelog' | 'about';

function App() {
  const [activePage, setActivePage] = useState<PageId>('home');

  const page = useMemo(() => {
    switch (activePage) {
      case 'resources':
        return <Resources />;
      case 'gallery':
        return <Gallery />;
      case 'forum':
        return <Forum />;
      case 'changelog':
        return <Changelog />;
      case 'about':
        return <About />;
      default:
        return <Home onNavigate={setActivePage} />;
    }
  }, [activePage]);

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {page}
    </Layout>
  );
}

export default App;
