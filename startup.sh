#!/bin/bash
# Setting up conductor
#npm start
open "http://localhost:8000/conductor"
open "http://localhost:8000/usher"

for i in {0..15}
do
  open -na "Google Chrome" --args --new-window "http://localhost:8000"
done
exit 0
