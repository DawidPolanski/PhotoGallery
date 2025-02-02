import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { fetchPhotos, fetchTrendingPhotos } from "../api/useUnsplash";
import MainLayout from "../components/layouts/MainLayout";
import PhotoGrid from "../components/layouts/photo/PhotoGrid";
import Header from "../components/layouts/Header";
import SearchBar from "../components/layouts/search/SearchBar";
import LoadingSkeleton from "../components/layouts/search/LoadingSkeleton";
import useDebounce from "../hooks/useDebounce";
import images from "../assets/CategoriesPhoto";

const Home = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [scrolling, setScrolling] = useState(false);

  const loadingRef = useRef(false);
  const scrollPosition = useRef(0);

  const debouncedQuery = useDebounce(query, 500);

  const categories = Object.keys(images).map((key) => ({
    name: key,
    query: key.toLowerCase(),
    image: images[key as keyof typeof images],
  }));

  const loadPhotos = async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      let fetchedPhotos;
      if (debouncedQuery.trim()) {
        if (page === 1) {
          setPhotos([]);
        }

        fetchedPhotos = await fetchPhotos(debouncedQuery, page);
      } else {
        if (page === 1) {
          setPhotos([]);
        }

        fetchedPhotos = await fetchTrendingPhotos(page);
      }
      setPhotos((prevPhotos) =>
        page === 1 ? fetchedPhotos : [...prevPhotos, ...fetchedPhotos]
      );
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    scrollPosition.current = currentScrollY;

    const bottom =
      window.innerHeight + currentScrollY >=
      document.documentElement.scrollHeight - 100;

    if (bottom && !loading) {
      setPage((prevPage) => prevPage + 1);
    }

    if (currentScrollY > 1) {
      setScrolling(true);
    } else {
      setScrolling(false);
    }
  };

  const handleCategoryClick = (categoryQuery: string) => {
    setQuery(categoryQuery);
    setPage(1);
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    setPage(1);
  };

  useEffect(() => {
    if (debouncedQuery) {
      setPage(1);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    loadPhotos();
  }, [debouncedQuery, page]);

  useEffect(() => {
    const onScroll = () => {
      requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <MainLayout>
      <div className="flex flex-col items-center min-h-screen px-4 py-8 pt-24">
        <Header scrolling={scrolling} />

        <div className="w-full flex justify-center mb-8 mt-8 sticky top-20 z-20">
          <SearchBar query={query} onChange={handleQueryChange} />
        </div>

        <div className="w-full max-w-4xl mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <motion.div
                key={category.query}
                className="p-4 rounded-lg cursor-pointer hover:opacity-90 transition-opacity relative overflow-hidden"
                onClick={() => handleCategoryClick(category.query)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  backgroundImage: `url(${category.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  height: "200px",
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <p className="text-center text-white font-medium text-lg">
                    {category.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {loading && <LoadingSkeleton />}

        <PhotoGrid photos={photos} onTagClick={handleTagClick} />

        {loading && (
          <div className="w-full flex justify-center py-4">
            <div className="animate-pulse">
              <div className="bg-gray-300 h-8 w-16 rounded-md" />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Home;
