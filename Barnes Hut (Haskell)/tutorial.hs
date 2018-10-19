
interlace:: [a]->[a]->[a]
interlace [] _ = []
interlace _ [] = []
interlace (x:xs) (y:ys) = x ++ y ++ interlace xs ys