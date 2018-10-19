-- CS300-SP17 Assignment 2: Barnes Hut Simulation
-- Deadline: 24 Feb 9pm
-- Submission: via LMS only
--
import System.Environment
import Data.List
import Graphics.Rendering.OpenGL hiding (($=))
import Graphics.UI.GLUT
import Control.Applicative
import Data.IORef
import Debug.Trace
import Data.Function (on)
--
-- PART 1: You are given many input files in the inputs directory and given 
-- code can read and parse the input files. You need to run "cabal update 
-- && cabal install glut" on your system to work on this assignment. Then
-- run "./ghc BH.hs && ./BH 1 < inputs/planets.txt" to run 1 iteration of
-- the algorithm and print updated positions. Replace 1 with any number to
-- run more iteration. You may also run it without an argument and it will
-- display the simulation using OpenGL in a window.
--
-- In the first part, you are to write the updateBody function to correctly 
-- update body after 1 unit of time has passed. You have to correctly 
-- update the position of a body by calculating the effect of all other
-- bodies on it. The placeholder implementation just moves the body left
-- without doing any physics. Read http://www.cs.princeton.edu/courses/
-- archive/fall03/cs126/assignments/nbody.html for help with physics. Try
-- simplyfying equations on paper before implementing them. You can compare
-- answers with the given binary solution.
--
-- Make helper functions as needed
type Vec2 = (Double, Double)
data Body = Body Vec2 Vec2 Double (Color3 Double)
updateBody :: (Foldable f) => f Body -> Body -> Body
updateBody foldme (Body (posx,posy) vel mass clr) = let x = (removeme (foldr (:) [] foldme) (Body (posx,posy) vel mass clr)) in 
                               Body (distance (velocity (getacc (resultant([getforce b (Body (posx,posy) vel mass clr)| b<-x])) (Body (posx,posy) vel mass clr)) (Body (posx,posy) vel mass clr)) (Body (posx,posy) vel mass clr)) (velocity (getacc (resultant([getforce b (Body (posx,posy) vel mass clr)| b<-x])) (Body (posx,posy) vel mass clr)) (Body (posx,posy) vel mass clr)) mass clr

getforce:: Body->Body->(Double,Double)
getforce (Body (posx,posy) vel mass clr) (Body (posx1,posy1) vel1 mass1 clr1) = 
    let force =((6.67*(10**(-11)))*mass*mass1)/(((posx-posx1)**2)+((posy-posy1)**2))
    in  ((force*(posx-posx1)/(((posx-posx1)**2)+((posy-posy1)**2))**(1/2)),(force*(posy-posy1)/(((posx-posx1)**2)+((posy-posy1)**2))**(1/2)))

resultant:: [(Double,Double)]->(Double,Double)
resultant b = foldr (\(x,y) (z,r)-> ((x+z),(y+r))) (0,0) b

getacc:: (Double,Double)->Body->(Double,Double)
getacc (x,y) (Body (posx,posy) vel mass clr) = (x/mass,y/mass)

velocity::(Double,Double)->Body->(Double,Double)
velocity (x,y) (Body pos (velx,vely) mass clr) = (velx+x,vely+y)

distance:: (Double,Double)->Body->(Double,Double)
distance (x,y) (Body (posx,posy) vel mass clr) = (posx+x,posy+y)

removeme:: [Body] -> Body -> [Body]
removeme [] _ = []
removeme ((Body (posx,posy) vel mass clr):xs) (Body (posx1,posy1) vel1 mass1 clr1) | (posx,posy)==(posx1,posy1) = removeme xs (Body (posx1,posy1) vel1 mass1 clr1) 
                  | otherwise = (Body (posx,posy) vel mass clr): removeme xs (Body (posx1,posy1) vel1 mass1 clr1)

-- PART 2: We will make a Quadtree to represent our universe. See 
-- http://www.cs.princeton.edu/courses/archive/fall03/cs126/assignments/
-- barnes-hut.html for help on this tree. The QT structure has the the
-- length of one side of quadrant) for internal nodes. The makeQT function
-- has arguments: center, length of quadrant side, a function to find
-- coordinates of an element of the tree (e.g. extract position from a Body
-- object), a function to summarize a list of nodes (e.g. to calculate a
-- Body with position center of gravity and total mass), and the list of
-- nodes to put in tree.
--
-- Note that inserting all nodes at once is much easier than inserting one
-- by one. Think of creating the root node (given all nodes), and then
-- divide the nodes into quadrants and let recursive calls create the
-- appropriate trees. In this part you do not have to give a correct
-- implementation of the summary function
--
-- Now make QT member of Foldable typeclass. See what function you are
-- required to implement. Once this is done, change the tick function below 
-- to create the tree and then pass it to updateBody function instead of a 
-- list of bodies. No change to updateBody function should be needed since
-- it works with any Foldable.
data QT a = Internal Double a (QT a,QT a,QT a,QT a) | Leaf a | Nil deriving (Show)

makeQT :: Vec2 -> Double -> (a->Vec2) -> ([a]->a) -> [a] -> (QT a)
makeQT center radius getPos summarize [] = Nil
makeQT center radius getPos summarize [x] = Leaf x
makeQT center radius getPos summarize bodies = Internal r (summarize bodies) (makeQT ((fst(center)+r),(snd(center)+r)) r getPos summarize (filter (\x->((fst(getPos(x))>=(fst(center))) && (snd(getPos(x))>=(snd(center))))) bodies), makeQT ((fst(center)-r),(snd(center)+r)) r getPos summarize (filter (\x->((fst(getPos(x))<(fst(center))) && (snd(getPos(x))>=(snd(center))))) bodies), makeQT ((fst(center)-r),(snd(center)-r)) r getPos summarize (filter (\x->((fst(getPos(x))<(fst(center))) && (snd(getPos(x))<(snd(center))))) bodies), makeQT ((fst(center)+r),(snd(center)-r)) r getPos summarize (filter (\x->((fst(getPos(x))>=(fst(center))) && (snd(getPos(x))<(snd(center))))) bodies)) 
                                                where r = (radius/2)

func::Body->Body->Body
func (Body (x1,y1) vel m1 clr) (Body (x2,y2) vel1 m2 clr1) = Body position vel (m1+m2) clr
                                                              where position = ((((x1*m1)+(x2*m2))/(m1+m2)),(((y1*m1)+(y2*m2))/(m1+m2)))
summarize:: [Body]->Body
summarize (x:xs) = foldr (\b c-> func b c) x xs

getPos::Body->Vec2
getPos (Body (x1,y1) vel mass clr) = (x1,y1)

instance Foldable QT where
   foldr f p Nil = p
   foldr f p (Leaf x) = f x p
   foldr f p (Internal radius bod (q1,q2,q3,q4)) = foldr f (foldr f (foldr f (foldr f p q4) q3) q2) q1


-- This functions takes a set of bodies and returns an updated set of 
-- bodies after 1 unit of time has passed (dt=1)

--tick ::Double -> [Body] -> [Body]
--tick radius bodies = let tree = makeQT (0,0) radius getPos summarize bodies
--	in fmap (updateBody tree) bodies


tick ::Double->[Body]->[Body]
tick radius bodies = let x = BH predicate (makeQT (0,0) radius getPos summarize bodies) in fmap (updateBody x) bodies


-- PART 3: Now we create another datatype that contains a quadtree and a 
-- function which given radius and a summarized body (containing center of
-- gravity and total mass) returns true if the summarized body is a good
-- enough approximation. Use 0.5 as threshold.
--
-- Make a correct summarize function to pass to makeQT above and then make
-- BH an instance of Foldable typeclass as well. However this instance
-- should use the internal node if the predicate function returns true and
-- recurse only if it returns false. Make sure to recurse over a BH type
-- variable. If your implementation is correct, you will be as fast as the
-- provided binary BH2 on large inputs like galaxy1.txt

instance Foldable BH where
   foldr f p (BH predicate Nil) = p
   foldr f p (BH predicate (Leaf x)) = f x p
   foldr f p (BH predicate (Internal radius bod (q1,q2,q3,q4))) | (predicate radius bod)==True = foldr f (foldr f (foldr f (foldr f p (BH predicate q4)) (BH predicate q3)) (BH predicate q2)) (BH predicate q1)
                                                                | otherwise =  f bod p 

data BH a = BH (Double -> a -> Bool) (QT a)

predicate:: Double->Body->Bool
predicate r (Body (cx,cy) vel mass clr) | ((r)/(sqrt ((((r/2)-cx)**2) + (((r/2)-cx)**2)))) < 0.5 = False
                                        | otherwise = True

---------------------------------------------------------------------------
-- You don't need to study the code below to work on the assignment
---------------------------------------------------------------------------
main :: IO ()
main = do
    (_,args) <- getArgsAndInitialize
    stdin <- getContents
    uncurry (mainChoice args) (parseInput stdin)

mainChoice :: [String] -> Double -> [Body] -> IO ()
mainChoice (iter:_) r bodies = putStr $ applyNtimes r bodies (read iter)
mainChoice [] r bodies = do
    createWindow "Barnes Hut"
    windowSize $= Size 700 700
    bodiesRef <- newIORef bodies
    ortho2D (-r) r (-r) r
    displayCallback $= (display r bodiesRef)
    addTimerCallback 10 (timer r bodiesRef)
    mainLoop

applyNtimes :: Double -> [Body] -> Int -> String
applyNtimes r bodies n = (unlines.map show) (iterate (tick r) bodies !! n)

parseInput :: String -> (Double, [Body])
parseInput input = 
    let (cnt:r:bodies) = lines input
    in (read r, map read (take (read cnt) bodies))

dispBody :: Body -> IO ()
dispBody (Body (x,y) _ _ rgb) = color rgb >> vertex (Vertex2 x y)

display :: Double -> IORef [Body] -> IO ()
display r bodiesRef = do
    clear [ColorBuffer]
    bodies <- get bodiesRef
    renderPrimitive Points (mapM_ dispBody bodies)
    flush

timer :: Double -> IORef [Body] -> IO ()
timer r bodiesRef = do
    postRedisplay Nothing
    bodies <- get bodiesRef
    bodiesRef $= tick r bodies 
    addTimerCallback 10 (timer r bodiesRef)

instance Read Body where
    readsPrec _ input = 
        let (x:y:vx:vy:m:r:g:b:rest) = words input
        in (\str -> [(Body (read x,read y) (read vx,read vy) (read m) 
            (Color3 ((read r)/255) ((read g)/255) ((read b)/255)), 
            unwords rest)]) input

instance Show Body where
    show (Body (x,y) (vx,vy) _ _) =
        "x=" ++ show x ++ " y=" ++ show y ++ " vx=" ++ 
            show vx ++ " vy=" ++ show vy

