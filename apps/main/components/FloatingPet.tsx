'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { PetType, getPetConfig } from '@/lib/petLibrary';
import SpeechBubble from '@/components/SpeechBubble';

interface FloatingPetProps {
  petType: PetType;
  startX?: number;
  startY?: number;
  speed?: number;
  delay?: number;
  onInteraction?: () => void;
  isFocused?: boolean;
  entering?: boolean;
  exiting?: boolean;
}

type ClickAnimation = 'shake' | 'flip' | 'fly-away' | 'bounce' | 'spin' | 'heart' | null;

// Helper function to get random position within viewport
function getRandomPosition(petElement: HTMLElement | null): { x: number; y: number } {
  if (!petElement) {
    return { x: 0, y: 0 };
  }
  
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const petWidth = petElement.offsetWidth || 60;
  const petHeight = petElement.offsetHeight || 60;

  const randomX = Math.random() * (viewportWidth - petWidth);
  const randomY = Math.random() * (viewportHeight - petHeight);

  return { x: randomX, y: randomY };
}

export default function FloatingPet({
  petType,
  startX,
  startY,
  speed = 1,
  delay = 0,
  onInteraction,
  isFocused = false,
  entering = false,
  exiting = false,
}: FloatingPetProps) {
  const [showBubble, setShowBubble] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [messages, setMessages] = useState<string[]>([]);
  const [clickAnimation, setClickAnimation] = useState<ClickAnimation>(null);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isHovered, setIsHovered] = useState(false);
  const petRef = useRef<HTMLDivElement>(null);
  const lastMessageIndex = useRef(-1);
  const movementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transitionEndHandlerRef = useRef<((e: TransitionEvent) => void) | null>(null);
  const isAnimatingRef = useRef(false);
  const currentPositionRef = useRef<{ x: number; y: number } | null>(null);

  const petConfig = getPetConfig(petType);
  const fallbackMessages = useMemo(() => petConfig.messages, [petType]);

  // Load messages from DB on mount
  const messagesLoadedRef = useRef(false);
  useEffect(() => {
    if (messagesLoadedRef.current) return;
    
    let mounted = true;

    async function loadMessages() {
      try {
        const response = await fetch(`/api/supportive-messages?petType=${petType}&_t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          if (mounted && data.messages && data.messages.length > 0) {
            setMessages(data.messages);
            messagesLoadedRef.current = true;
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to load messages from API, using fallback:', error);
      }
      
      if (mounted) {
        setMessages(fallbackMessages);
        messagesLoadedRef.current = true;
      }
    }
    
    const timeoutId = setTimeout(loadMessages, 500);
    const refreshInterval = setInterval(() => {
      if (mounted) {
        loadMessages();
      }
    }, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      clearInterval(refreshInterval);
    };
  }, [petType, fallbackMessages]);

  // Get a new message (different from last one)
  const getNewMessage = useCallback(() => {
    const availableMessages = messages.length > 0 ? messages : fallbackMessages;
    if (availableMessages.length === 0) return '';
    
    if (availableMessages.length === 1) {
      return availableMessages[0];
    }
    
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * availableMessages.length);
    } while (newIndex === lastMessageIndex.current && availableMessages.length > 1);
    
    lastMessageIndex.current = newIndex;
    return availableMessages[newIndex];
  }, [messages, fallbackMessages]);

  // Track timeouts for cleanup
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      if (heartTimeoutRef.current) clearTimeout(heartTimeoutRef.current);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      if (movementTimeoutRef.current) clearTimeout(movementTimeoutRef.current);
    };
  }, []);

  // Handle click with animations
  const handleClick = useCallback(() => {
    if (onInteraction) {
      onInteraction();
    }

    // Clear any existing timeouts
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    if (heartTimeoutRef.current) clearTimeout(heartTimeoutRef.current);
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);

    // Show message
    const newMessage = getNewMessage();
    if (newMessage) {
      setCurrentMessage(newMessage);
      setShowBubble(true);
      messageTimeoutRef.current = setTimeout(() => setShowBubble(false), 6000);
    }

    // Random click animation
    const animations: ClickAnimation[] = ['shake', 'flip', 'bounce', 'spin', 'heart'];
    const randomAnim = animations[Math.floor(Math.random() * animations.length)];
    setClickAnimation(randomAnim);

    // Add hearts
    if (randomAnim === 'heart' || Math.random() > 0.5) {
      const newHearts = Array.from({ length: 3 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 40 - 20,
        y: Math.random() * 40 - 20,
      }));
      setHearts((prev) => [...prev, ...newHearts]);
      heartTimeoutRef.current = setTimeout(() => {
        setHearts((prev) => prev.filter((h) => !newHearts.some((nh) => nh.id === h.id)));
      }, 2000);
    }

    // Clear animation after it completes
    animTimeoutRef.current = setTimeout(() => setClickAnimation(null), 1000);
  }, [onInteraction, getNewMessage]);

  // Function to calculate a waypoint path (creates smooth, organic movement)
  const calculateWaypointPath = useCallback((
    start: { x: number; y: number },
    end: { x: number; y: number },
    petElement: HTMLDivElement
  ): Array<{ x: number; y: number }> => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const petWidth = petElement.offsetWidth || 60;
    const petHeight = petElement.offsetHeight || 60;
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // For tortoise-like movement, use smaller steps for gradual, deliberate motion
    // Break distances into smaller segments proportional to pet size
    const petSize = Math.max(petWidth, petHeight);
    const maxStepSize = Math.max(petSize * 1.5, 100); // Steps about 1.5x pet size, minimum 100px
    const numSteps = Math.max(1, Math.ceil(distance / maxStepSize));
    
    const waypoints: Array<{ x: number; y: number }> = [];
    
    // Use smooth easing function for waypoint placement (ease-in-out curve)
    for (let i = 1; i <= numSteps; i++) {
      const t = i / numSteps;
      // Smooth easing: ease-in-out cubic
      const eased = t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      // Base position along the path with smooth easing
      let stepX = start.x + dx * eased;
      let stepY = start.y + dy * eased;
      
      // Add gentle organic curve - smooth perpendicular offset
      if (distance > 50) {
        const perpX = -dy / distance;
        const perpY = dx / distance;
        
        // Create a smooth sine wave for organic curve (not random)
        const curveAmount = Math.sin(t * Math.PI) * Math.min(distance * 0.15, 40);
        stepX += perpX * curveAmount;
        stepY += perpY * curveAmount;
      }
      
      // Ensure within viewport
      waypoints.push({
        x: Math.max(0, Math.min(viewportWidth - petWidth, stepX)),
        y: Math.max(0, Math.min(viewportHeight - petHeight, stepY)),
      });
    }
    
    // Add final destination
    waypoints.push(end);
    
    return waypoints;
  }, []);

  // Function to move through waypoints
  const moveThroughWaypoints = useCallback((
    petElement: HTMLDivElement,
    waypoints: Array<{ x: number; y: number }>,
    waypointIndex: number = 0
  ) => {
    if (waypointIndex >= waypoints.length || exiting || isFocused) {
      // Finished waypoints, schedule next movement with tortoise-like pauses
      // Tortoises pause longer - they're deliberate and take their time
      const pauseType = Math.random();
      let delay: number;
      
      if (pauseType < 0.2) {
        // 20% chance: Shorter pause (2-4s) - brief rest before moving
        delay = Math.random() * 2000 + 2000;
      } else if (pauseType < 0.6) {
        // 40% chance: Normal pause (4-7s) - typical tortoise deliberation
        delay = Math.random() * 3000 + 4000;
      } else {
        // 40% chance: Long pause (7-12s) - extended rest/observation
        delay = Math.random() * 5000 + 7000;
      }
      
      movementTimeoutRef.current = setTimeout(() => {
        if (!exiting && !isFocused && petElement && currentPositionRef.current) {
          // Tortoise-like movements: small, deliberate steps - no large jumps
          const currentPos = currentPositionRef.current;
          const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
          const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
          const petWidth = petElement.offsetWidth || 60;
          const petHeight = petElement.offsetHeight || 60;
          
          let destination: { x: number; y: number };
          const movementType = Math.random();
          
          if (movementType < 0.8) {
            // 80% chance: Very small nearby movement (tortoise steps)
            // Movement proportional to pet size - about 1-3 pet lengths
            const petSize = Math.max(petWidth, petHeight);
            const wanderDistance = Math.random() * (petSize * 2) + petSize; // 1-3 pet lengths
            const angle = Math.random() * Math.PI * 2;
            destination = {
              x: Math.max(0, Math.min(viewportWidth - petWidth, currentPos.x + Math.cos(angle) * wanderDistance)),
              y: Math.max(0, Math.min(viewportHeight - petHeight, currentPos.y + Math.sin(angle) * wanderDistance)),
            };
          } else if (movementType < 0.95) {
            // 15% chance: Medium distance movement (3-5 pet lengths)
            const petSize = Math.max(petWidth, petHeight);
            const wanderDistance = Math.random() * (petSize * 2) + (petSize * 3); // 3-5 pet lengths
            const angle = Math.random() * Math.PI * 2;
            destination = {
              x: Math.max(0, Math.min(viewportWidth - petWidth, currentPos.x + Math.cos(angle) * wanderDistance)),
              y: Math.max(0, Math.min(viewportHeight - petHeight, currentPos.y + Math.sin(angle) * wanderDistance)),
            };
          } else {
            // 5% chance: Longer movement (rare exploration, but still reasonable)
            const petSize = Math.max(petWidth, petHeight);
            const wanderDistance = Math.random() * (petSize * 3) + (petSize * 5); // 5-8 pet lengths
            const angle = Math.random() * Math.PI * 2;
            destination = {
              x: Math.max(0, Math.min(viewportWidth - petWidth, currentPos.x + Math.cos(angle) * wanderDistance)),
              y: Math.max(0, Math.min(viewportHeight - petHeight, currentPos.y + Math.sin(angle) * wanderDistance)),
            };
          }
          
          const waypoints = calculateWaypointPath(currentPos, destination, petElement);
          moveThroughWaypoints(petElement, waypoints);
        }
      }, delay);
      return;
    }

    const waypoint = waypoints[waypointIndex];
    
    // Smooth, consistent transition durations based on distance and pet size
    const distance = Math.sqrt(
      Math.pow(waypoint.x - (currentPositionRef.current?.x || 0), 2) +
      Math.pow(waypoint.y - (currentPositionRef.current?.y || 0), 2)
    );
    
    // Calculate pet size for proportional speed (tortoise-like movement)
    const petWidth = petElement.offsetWidth || 60;
    const petHeight = petElement.offsetHeight || 60;
    const petSize = Math.max(petWidth, petHeight);
    
    // Tortoise-like speed: very slow and deliberate
    // Speed is proportional to pet size: ~0.05-0.08px/ms (much slower than before)
    // A 60px pet moving 300px should take ~4-6 seconds (tortoise pace)
    const speedMultiplier = 15 + (petSize / 10); // Larger pets move slightly slower relative to size
    const baseDuration = Math.min(Math.max(distance * speedMultiplier, 1500), 8000); // 1.5s to 8s
    const duration = baseDuration; // No randomness for smoother feel
    
    // Use consistent smooth easing for organic flow
    const easing = 'cubic-bezier(0.4, 0, 0.2, 1)'; // Smooth ease-in-out
    
    petElement.style.transition = `transform ${duration}ms ${easing}, opacity 1.5s ease-in-out`;
    
    petElement.style.transform = `translate(${waypoint.x}px, ${waypoint.y}px)`;
    currentPositionRef.current = waypoint;
    isAnimatingRef.current = true;

    // Remove previous handler
    if (transitionEndHandlerRef.current) {
      petElement.removeEventListener('transitionend', transitionEndHandlerRef.current);
    }

    // Create handler for this waypoint
    const handler = (e: TransitionEvent) => {
      if (e.propertyName !== 'transform') return;
      
      petElement.removeEventListener('transitionend', handler);
      transitionEndHandlerRef.current = null;
      
      // Smooth continuation - minimal pause for fluid movement
      moveThroughWaypoints(petElement, waypoints, waypointIndex + 1);
    };

    transitionEndHandlerRef.current = handler;
    petElement.addEventListener('transitionend', handler, { once: true });
  }, [exiting, isFocused, calculateWaypointPath, getRandomPosition]);

  // Function to spawn pet from off-screen
  const spawnPet = useCallback((petElement: HTMLDivElement) => {
    if (!petElement) return;

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const petWidth = petElement.offsetWidth || 60;
    const petHeight = petElement.offsetHeight || 60;

    // Determine a random edge to start from (0: top, 1: right, 2: bottom, 3: left)
    const startEdge = Math.floor(Math.random() * 4);
    let startX = 0;
    let startY = 0;

    switch (startEdge) {
      case 0: // Top edge
        startX = Math.random() * (viewportWidth - petWidth);
        startY = -petHeight;
        break;
      case 1: // Right edge
        startX = viewportWidth;
        startY = Math.random() * (viewportHeight - petHeight);
        break;
      case 2: // Bottom edge
        startX = Math.random() * (viewportWidth - petWidth);
        startY = viewportHeight;
        break;
      case 3: // Left edge
        startX = -petWidth;
        startY = Math.random() * (viewportHeight - petHeight);
        break;
    }

    // Set pet's initial position and opacity
    petElement.style.transform = `translate(${startX}px, ${startY}px)`;
    petElement.style.opacity = '0';
    currentPositionRef.current = { x: startX, y: startY };

    // Force reflow to ensure initial state is applied
    // eslint-disable-next-line no-unused-expressions
    petElement.offsetHeight;

    // Animate into a random on-screen position with waypoints for organic entry
    setTimeout(() => {
      const { x: endX, y: endY } = getRandomPosition(petElement);
      const startPos = { x: startX, y: startY };
      const endPos = { x: endX, y: endY };
      
      // Use waypoints for entry too
      const entryWaypoints = calculateWaypointPath(startPos, endPos, petElement);
      
      // First waypoint or direct
      const firstTarget = entryWaypoints[0] || endPos;
      petElement.style.transform = `translate(${firstTarget.x}px, ${firstTarget.y}px)`;
      petElement.style.opacity = '1';
      currentPositionRef.current = firstTarget;
      
      // Continue through waypoints if there are more
      if (entryWaypoints.length > 1) {
        setTimeout(() => {
          moveThroughWaypoints(petElement, entryWaypoints.slice(1));
        }, 100);
      }
    }, 50);
  }, [calculateWaypointPath, moveThroughWaypoints, getRandomPosition]);

  // Function for continuous random movement
  const animatePetMovement = useCallback((petElement: HTMLDivElement) => {
    if (!petElement || exiting || isFocused) return;

    // Get current position
    const currentPos = currentPositionRef.current || getRandomPosition(petElement);
    if (!currentPositionRef.current) {
      currentPositionRef.current = currentPos;
    }

    // Calculate destination
    const destination = getRandomPosition(petElement);
    
    // Calculate waypoint path
    const waypoints = calculateWaypointPath(currentPos, destination, petElement);
    
    // Start moving through waypoints
    moveThroughWaypoints(petElement, waypoints);
  }, [exiting, isFocused, calculateWaypointPath, moveThroughWaypoints, getRandomPosition]);

  // Function to hide/exit pet smoothly
  const hidePet = useCallback((petElement: HTMLDivElement) => {
    if (!petElement) return;

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const petWidth = petElement.offsetWidth || 60;
    const petHeight = petElement.offsetHeight || 60;

    // Get current position
    const currentPos = currentPositionRef.current || { x: viewportWidth / 2, y: viewportHeight / 2 };

    // Determine nearest edge to exit to
    const distToTop = currentPos.y;
    const distToBottom = viewportHeight - currentPos.y;
    const distToLeft = currentPos.x;
    const distToRight = viewportWidth - currentPos.x;

    const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);
    let exitX = 0;
    let exitY = 0;

    if (minDist === distToTop) {
      exitX = currentPos.x;
      exitY = -petHeight;
    } else if (minDist === distToBottom) {
      exitX = currentPos.x;
      exitY = viewportHeight;
    } else if (minDist === distToLeft) {
      exitX = -petWidth;
      exitY = currentPos.y;
    } else {
      exitX = viewportWidth;
      exitY = currentPos.y;
    }

    // Animate out
    petElement.style.transform = `translate(${exitX}px, ${exitY}px)`;
    petElement.style.opacity = '0';
  }, []);

  // Initialize pet position and start animation
  useEffect(() => {
    if (!petRef.current) return;

    const petElement = petRef.current;

    // Clear any existing timeouts and handlers
    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
    }
    if (transitionEndHandlerRef.current) {
      petElement.removeEventListener('transitionend', transitionEndHandlerRef.current);
      transitionEndHandlerRef.current = null;
    }

    if (exiting) {
      // Exit animation
      hidePet(petElement);
      return;
    }

    if (entering || !currentPositionRef.current) {
      // Spawn from off-screen
      spawnPet(petElement);
      
      // Wait for spawn animation to complete, then start continuous movement
      // Spawn animation takes ~1.5s (CSS transition), wait a bit longer to ensure it completes
      const startMovementTimeout = setTimeout(() => {
        if (!exiting && petRef.current && currentPositionRef.current) {
          animatePetMovement(petRef.current);
        }
      }, 1600); // Wait for spawn animation (1.5s) + small buffer

      return () => {
        clearTimeout(startMovementTimeout);
      };
    } else if (startX !== undefined && startY !== undefined) {
      // Use provided start position
      petElement.style.transform = `translate(${startX}px, ${startY}px)`;
      petElement.style.opacity = '1';
      currentPositionRef.current = { x: startX, y: startY };
      // Small delay to ensure position is set before starting movement
      setTimeout(() => {
        if (petRef.current && !exiting) {
          animatePetMovement(petRef.current);
        }
      }, 100);
    } else if (currentPositionRef.current) {
      // Already positioned, just start movement
      animatePetMovement(petElement);
    }

    return () => {
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current);
      }
      if (transitionEndHandlerRef.current && petElement) {
        petElement.removeEventListener('transitionend', transitionEndHandlerRef.current);
        transitionEndHandlerRef.current = null;
      }
    };
  }, [entering, exiting, spawnPet, animatePetMovement, hidePet, startX, startY]);

  // Handle window resize
  useEffect(() => {
    if (!petRef.current || exiting) return;

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (petRef.current && currentPositionRef.current && !exiting) {
          // Reposition if pet is outside viewport
          const { x, y } = getRandomPosition(petRef.current);
          petRef.current.style.transform = `translate(${x}px, ${y}px)`;
          currentPositionRef.current = { x, y };
        }
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [exiting]);

  // Show speech bubble periodically
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
    }

    const scheduleBubble = () => {
      const availableMessages = messages.length > 0 ? messages : fallbackMessages;
      if (availableMessages.length > 0 && !showBubble && !exiting) {
        const randomMessage = getNewMessage();
        setCurrentMessage(randomMessage);
        setShowBubble(true);
        if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = setTimeout(() => setShowBubble(false), 5000);
      }
      
      const delay = 20000 + Math.random() * 15000;
      bubbleTimeoutRef.current = setTimeout(scheduleBubble, delay);
    };

    bubbleTimeoutRef.current = setTimeout(scheduleBubble, 20000 + Math.random() * 15000);

    return () => {
      if (bubbleTimeoutRef.current) {
        clearTimeout(bubbleTimeoutRef.current);
        bubbleTimeoutRef.current = null;
      }
    };
  }, [messages, fallbackMessages, showBubble, getNewMessage, exiting]);

  // Animation classes for click interactions only (hover handled by CSS)
  const animationClass = clickAnimation
    ? `pet-animation-${clickAnimation}`
    : '';

  return (
    <div
      ref={petRef}
      className="floating-pet"
      style={{
        cursor: 'pointer',
      }}
      onClick={handleClick}
      onMouseEnter={() => !isFocused && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showBubble && currentMessage && (
        <SpeechBubble message={currentMessage} position="bottom" />
      )}
      
      {/* Hearts */}
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="pet-heart"
          style={{
            position: 'absolute',
            left: `${heart.x}px`,
            top: `${heart.y}px`,
            fontSize: '20px',
            pointerEvents: 'none',
            animation: 'heartFloat 2s ease-out forwards',
          }}
        >
          💚
        </div>
      ))}

      <div
        className={`pet-sprite ${animationClass}`}
        style={{
          width: '100%',
          height: '100%',
          '--pet-delay': delay / 1000, // CSS custom property for animation delay
          ...petConfig.styles,
        } as React.CSSProperties}
        onMouseEnter={(e) => {
          e.stopPropagation();
          if (!isFocused) setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          setIsHovered(false);
        }}
      >
        <div 
          className="pet-sprite-content"
          dangerouslySetInnerHTML={{ __html: petConfig.svg }} 
        />
      </div>
    </div>
  );
}
