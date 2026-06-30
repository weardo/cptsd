'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import FloatingPet from './FloatingPet';
import { PetType, getRandomPetType } from '../lib/petLibrary';

interface FloatingPetsContainerProps {
  initialCount?: number;
  petTypes?: PetType[];
  maxCount?: number;
}

const STORAGE_KEY = 'cptsd-pet-interactions';
const MIN_PETS = 2;
const MAX_PETS = 8;
const INTERACTION_THRESHOLD = 3; // Interactions needed to add a pet
const FOCUS_TIMEOUT = 30000; // 30 seconds of no interaction = focused reading
const INTERACTION_COOLDOWN = 2000; // 2 seconds between interaction tracking
const MOBILE_BREAKPOINT = 768; // Screens smaller than 768px are considered mobile

export default function FloatingPetsContainer({
  initialCount = 3,
  petTypes,
  maxCount = MAX_PETS,
}: FloatingPetsContainerProps) {
  const [pets, setPets] = useState<Array<{ type: PetType; id: number; entering: boolean; exiting?: boolean }>>([]);
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileEnabled, setMobileEnabled] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [isCleared, setIsCleared] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [userActivity, setUserActivity] = useState(0);
  const lastInteractionTime = useRef(Date.now());
  const interactionCooldown = useRef(0);
  const nextPetId = useRef(0);
  const initializedRef = useRef(false);

  // Load interaction count and mobile enabled state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setInteractionCount(data.count || 0);
        setIsCleared(data.cleared || false);
        setMobileEnabled(data.mobileEnabled || false);
      }
    } catch (e) {
      // Ignore errors
    }
  }, []);

  // Save interaction count and mobile enabled state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ count: interactionCount, cleared: isCleared, mobileEnabled })
      );
    } catch (e) {
      // Ignore errors
    }
  }, [interactionCount, isCleared, mobileEnabled]);

  // Track user interactions (scroll, mouse move, click, keypress)
  useEffect(() => {
    if (!mounted || isCleared) return;

    const handleInteraction = () => {
      const now = Date.now();
      
      // Cooldown to prevent spam
      if (now - interactionCooldown.current < INTERACTION_COOLDOWN) {
        return;
      }
      interactionCooldown.current = now;

      setUserActivity((prev) => prev + 1);
      setInteractionCount((prev) => prev + 1); // Increment interaction count
      lastInteractionTime.current = now;
      setIsFocused(false);
    };

    const handleScroll = () => handleInteraction();
    // Mouse move is less sensitive - only count significant movement
    let lastMouseX = 0;
    let lastMouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = Math.abs(e.clientX - lastMouseX);
      const deltaY = Math.abs(e.clientY - lastMouseY);
      // Only count if mouse moved significantly (more than 50px)
      if (deltaX > 50 || deltaY > 50) {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        handleInteraction();
      }
    };
    const handleClick = () => handleInteraction();
    const handleKeyPress = () => handleInteraction();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove as EventListener, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });
    window.addEventListener('keydown', handleKeyPress, { passive: true });

    // Check for focus state (no interaction for a while)
    const focusCheckInterval = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionTime.current;
      if (timeSinceLastInteraction > FOCUS_TIMEOUT) {
        setIsFocused(true);
      } else {
        setIsFocused(false);
      }
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyPress);
      clearInterval(focusCheckInterval);
    };
  }, [mounted, isCleared]);

  // Calculate pet count based on interactions and focus state
  const calculatePetCount = useCallback(() => {
    if (isCleared) return 0;
    
    // On mobile, disable pets by default unless explicitly enabled
    if (isMobile && !mobileEnabled) return 0;
    
    // When focused, reduce pets significantly
    if (isFocused) {
      return Math.max(MIN_PETS, Math.floor(initialCount / 2));
    }
    
    // Base count + bonus for interactions
    // Every INTERACTION_THRESHOLD interactions adds 1 pet (up to maxCount)
    const bonusPets = Math.floor(interactionCount / INTERACTION_THRESHOLD);
    const totalCount = Math.min(initialCount + bonusPets, maxCount);
    
    return prefersReducedMotion ? Math.min(totalCount, 2) : totalCount;
  }, [initialCount, interactionCount, maxCount, prefersReducedMotion, isCleared, isFocused, isMobile, mobileEnabled]);

  // Handle pet interaction (click on pet)
  const handlePetInteraction = useCallback(() => {
    setInteractionCount((prev) => prev + 1);
    setUserActivity((prev) => prev + 1);
    lastInteractionTime.current = Date.now();
    setIsFocused(false);
  }, []);

  // Clear all pets
  const handleClearPets = useCallback(() => {
    setIsCleared(true);
    setPets([]);
  }, []);

  // Restore pets
  const handleRestorePets = useCallback(() => {
    setIsCleared(false);
    // On mobile, also enable pets when restoring
    if (isMobile) {
      setMobileEnabled(true);
      // Reset initialization flag so pets can be initialized
      initializedRef.current = false;
    }
    setInteractionCount(0);
    setUserActivity(0);
    lastInteractionTime.current = Date.now();
  }, [isMobile]);

  useEffect(() => {
    setMounted(true);
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reducedMotion = mediaQuery.matches;
    setPrefersReducedMotion(reducedMotion);
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleMotionChange);
    
    // Check for mobile screen size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Update pets when count changes (with smooth transitions)
  useEffect(() => {
    if (!mounted || isCleared) return;
    
    const targetCount = calculatePetCount();
    const currentCount = pets.length;

    // Only update if there's a meaningful difference (at least 1 pet difference)
    if (Math.abs(targetCount - currentCount) < 1) return;
    
    // Don't remove pets if we just mounted (give them time to settle)
    if (currentCount > 0 && targetCount < currentCount && pets.some(p => p.entering)) {
      // Wait for entering pets to finish before removing any
      return;
    }

    if (targetCount > currentCount) {
      // Add new pets (slide in from off-screen)
      const newPets: Array<{ type: PetType; id: number; entering: boolean; exiting?: boolean }> = [];
      for (let i = currentCount; i < targetCount; i++) {
        const type = petTypes
          ? petTypes[i % petTypes.length]
          : getRandomPetType();
        newPets.push({ 
          type, 
          id: nextPetId.current++, 
          entering: true,
          exiting: false,
        });
      }
      
      // Add new pets with entering animation
      setPets((prev) => [...prev, ...newPets]);
      
      // Mark as entered after animation
      const enterTimeout = setTimeout(() => {
        setPets((prev) => 
          prev.map((pet) => 
            newPets.some((np) => np.id === pet.id) 
              ? { ...pet, entering: false, exiting: false }
              : pet
          )
        );
      }, 1000);
      
      return () => {
        clearTimeout(enterTimeout);
      };
    } else if (targetCount < currentCount) {
      // Remove pets (slide out) - remove the most recently added ones
      const toRemove = currentCount - targetCount;
      const sorted = [...pets].sort((a, b) => b.id - a.id);
      const removing = sorted.slice(0, toRemove).filter(p => !p.exiting);
      
      if (removing.length > 0) {
        // Mark as exiting
        setPets((prev) => 
          prev.map((pet) => 
            removing.some((r) => r.id === pet.id)
              ? { ...pet, entering: false, exiting: true }
              : pet
          )
        );
        
        // Animate out - give enough time for exit animation
        const exitTimeout = setTimeout(() => {
          setPets((current) => 
            current.filter((pet) => !removing.some((r) => r.id === pet.id))
          );
        }, 1200);
        
        return () => clearTimeout(exitTimeout);
      }
    } else if (targetCount === 0 && currentCount > 0) {
      // Clear all - mark all as exiting first
      setPets((prev) => prev.map((pet) => ({ ...pet, exiting: true, entering: false })));
      const clearAllTimeout = setTimeout(() => {
        setPets([]);
      }, 1200);
      
      return () => {
        clearTimeout(clearAllTimeout);
      };
    }
  }, [mounted, isCleared, calculatePetCount, petTypes, pets.length, interactionCount, isFocused]);

  // Initialize pets on mount - only run once
  useEffect(() => {
    if (!mounted || isCleared || initializedRef.current) return;
    // Don't initialize if on mobile and not enabled
    if (isMobile && !mobileEnabled) return;
    
    const initialCount = calculatePetCount();
    const petList: Array<{ type: PetType; id: number; entering: boolean; exiting?: boolean }> = [];
    
    for (let i = 0; i < initialCount; i++) {
      const type = petTypes
        ? petTypes[i % petTypes.length]
        : getRandomPetType();
      petList.push({ 
        type, 
        id: nextPetId.current++, 
        entering: true,
        exiting: false,
      });
    }
    
    setPets(petList);
    initializedRef.current = true;
    
    // Mark as entered after animation
    const initTimeout = setTimeout(() => {
      setPets((prev) => 
        prev.map((pet) => ({ ...pet, entering: false, exiting: false }))
      );
    }, 1000);
    
    return () => clearTimeout(initTimeout);
  }, [mounted, isCleared, isMobile, mobileEnabled, calculatePetCount, petTypes]);

  if (!mounted) return null;

  // Show restore button if cleared or if on mobile and not enabled
  if (isCleared || (isMobile && !mobileEnabled)) {
    return (
      <div 
        className="pet-control-container fixed bottom-4 right-4 z-[100] pointer-events-auto"
        style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 100 }}
      >
        <button
          onClick={handleRestorePets}
          className="btn btn-secondary text-sm px-4 py-2 shadow-lg"
          title="Restore pets"
        >
          🐾 Restore Pets
        </button>
      </div>
    );
  }

  if (prefersReducedMotion) {
    // Still show pets but with minimal animation
    return (
      <>
        <div className="floating-pets-container fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 60 }}>
          {pets.slice(0, 2).map((pet) => (
            <FloatingPet
              key={pet.id}
              petType={pet.type}
              speed={0.2}
              delay={pet.id * 1000}
              onInteraction={handlePetInteraction}
              isFocused={isFocused}
            />
          ))}
        </div>
        {pets.length > 0 && (
          <div 
            className="pet-control-container fixed bottom-4 right-4 z-[100] pointer-events-auto"
            style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 100 }}
          >
            <button
              onClick={handleClearPets}
              className="btn btn-secondary text-sm px-3 py-2 shadow-lg"
              title="Clear pets"
            >
              ✕
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="floating-pets-container fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 60 }}>
        {pets.map((pet) => (
          <FloatingPet
            key={pet.id}
            petType={pet.type}
            speed={isFocused ? 0.2 : 0.5 + Math.random() * 0.5}
            delay={pet.id * 1000}
            onInteraction={handlePetInteraction}
            isFocused={isFocused}
            entering={pet.entering}
            exiting={pet.exiting}
          />
        ))}
      </div>
      {pets.length > 0 && (
        <div 
          className="pet-control-container fixed bottom-4 right-4 z-[100] pointer-events-auto flex gap-2 items-center"
          style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 100 }}
        >
          {interactionCount > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-gray-600 shadow-md flex items-center gap-1">
              <span>💚</span>
              <span>{interactionCount}</span>
            </div>
          )}
          <button
            onClick={handleClearPets}
            className="btn btn-secondary text-sm px-3 py-2 shadow-lg"
            title="Clear pets"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
